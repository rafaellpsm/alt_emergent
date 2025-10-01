from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, BackgroundTasks, File, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, HttpUrl, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
import logging
import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from pathlib import Path
import secrets
import aiofiles
import shutil

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Upload configuration
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create FastAPI app
app = FastAPI(title="ALT Ilhabela Portal", version="1.0.0")
api_router = APIRouter(prefix="/api")

# Mount uploads directory for static files (use /api prefix for proper routing)
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Security
security = HTTPBearer()

# User roles
class UserRole:
    ADMIN = "admin"
    ASSOCIADO = "associado"
    MEMBRO = "membro"
    PARCEIRO = "parceiro"

# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    nome: str
    telefone: Optional[str] = None
    role: str
    ativo: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    nome: str
    telefone: Optional[str] = None
    role: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Enhanced Application Models
class CandidaturaBase(BaseModel):
    nome: str
    email: EmailStr
    telefone: str
    mensagem: Optional[str] = None

class CandidaturaMembro(CandidaturaBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tipo: str = Field(default="membro")
    endereco: str
    num_imoveis: int
    link_imovel: Optional[HttpUrl] = None  # New field
    experiencia_locacao: Optional[str] = None  # New field
    renda_mensal_estimada: Optional[float] = None  # New field
    possui_alvara: bool = False  # New field
    status: str = Field(default="pendente")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CandidaturaParceiro(CandidaturaBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tipo: str = Field(default="parceiro")
    nome_empresa: str
    categoria: str  # Restaurante, Turismo, etc.
    website: Optional[HttpUrl] = None
    link_empresa: Optional[HttpUrl] = None  # New field
    cnpj: Optional[str] = None  # New field
    tempo_operacao: Optional[str] = None  # New field
    servicos_oferecidos: Optional[str] = None  # New field
    capacidade_atendimento: Optional[str] = None  # New field
    status: str = Field(default="pendente")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CandidaturaAssociado(CandidaturaBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tipo: str = Field(default="associado")
    ocupacao: str
    motivo_interesse: str
    empresa_trabalho: Optional[str] = None  # New field
    linkedin: Optional[HttpUrl] = None  # New field
    contribuicao_pretendida: Optional[str] = None  # New field
    disponibilidade: Optional[str] = None  # New field
    status: str = Field(default="pendente")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Enhanced Property Models
class Imovel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    titulo: str
    descricao: str
    tipo: str  # Casa, Apartamento, Pousada, etc.
    regiao: str
    endereco_completo: str
    preco_diaria: float
    preco_semanal: Optional[float] = None
    preco_mensal: Optional[float] = None
    num_quartos: int
    num_banheiros: int
    capacidade: int
    area_m2: Optional[float] = None
    possui_piscina: bool = False
    possui_churrasqueira: bool = False
    possui_wifi: bool = True
    permite_pets: bool = False
    tem_vista_mar: bool = False
    tem_ar_condicionado: bool = False
    fotos: List[str] = []  # Changed from HttpUrl to str for photo URLs
    link_booking: Optional[str] = None
    link_airbnb: Optional[str] = None
    status_aprovacao: str = Field(default="pendente")  # pendente, aprovado, recusado
    ativo: bool = True
    destaque: bool = False  # For featuring on main page
    proprietario_id: str
    visualizacoes: int = 0
    cliques_link: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    @field_validator('link_booking', 'link_airbnb', mode='before')
    @classmethod
    def empty_str_to_none(cls, v):
        if v == '' or v is None:
            return None
        return v

class ImovelCreate(BaseModel):
    titulo: str
    descricao: str
    tipo: str
    regiao: str
    endereco_completo: str
    preco_diaria: float
    preco_semanal: Optional[float] = None
    preco_mensal: Optional[float] = None
    num_quartos: int
    num_banheiros: int
    capacidade: int
    area_m2: Optional[float] = None
    possui_piscina: bool = False
    possui_churrasqueira: bool = False
    possui_wifi: bool = True
    permite_pets: bool = False
    tem_vista_mar: bool = False
    tem_ar_condicionado: bool = False
    fotos: List[str] = Field(default_factory=list)
    link_booking: Optional[str] = None
    link_airbnb: Optional[str] = None
    
    @field_validator('link_booking', 'link_airbnb', mode='before')
    @classmethod
    def empty_str_to_none(cls, v):
        if v == '' or v is None:
            return None
        return v

class ImovelUpdate(BaseModel):
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    tipo: Optional[str] = None
    regiao: Optional[str] = None
    endereco_completo: Optional[str] = None
    preco_diaria: Optional[float] = None
    preco_semanal: Optional[float] = None
    preco_mensal: Optional[float] = None
    num_quartos: Optional[int] = None
    num_banheiros: Optional[int] = None
    capacidade: Optional[int] = None
    area_m2: Optional[float] = None
    possui_piscina: Optional[bool] = None
    possui_churrasqueira: Optional[bool] = None
    possui_wifi: Optional[bool] = None
    permite_pets: Optional[bool] = None
    tem_vista_mar: Optional[bool] = None
    tem_ar_condicionado: Optional[bool] = None
    video_url: Optional[HttpUrl] = None
    link_booking: Optional[HttpUrl] = None
    link_airbnb: Optional[HttpUrl] = None

# Enhanced Partner Profile Models
class PerfilParceiro(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    nome_empresa: str
    descricao: str
    categoria: str
    telefone: str
    endereco: Optional[str] = None
    website: Optional[HttpUrl] = None
    instagram: Optional[HttpUrl] = None
    facebook: Optional[HttpUrl] = None
    fotos: List[str] = []
    video_url: Optional[HttpUrl] = None
    horario_funcionamento: Optional[str] = None
    servicos: List[str] = []
    preco_medio: Optional[str] = None
    aceita_cartao: bool = True
    delivery: bool = False
    destaque: bool = False  # For featuring on main page
    ativo: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PerfilParceiroCreate(BaseModel):
    nome_empresa: str
    descricao: str
    categoria: str
    telefone: str
    endereco: Optional[str] = None
    website: Optional[HttpUrl] = None
    instagram: Optional[HttpUrl] = None
    facebook: Optional[HttpUrl] = None
    horario_funcionamento: Optional[str] = None
    servicos: List[str] = []
    preco_medio: Optional[str] = None
    aceita_cartao: bool = True
    delivery: bool = False

# Enhanced Content Models
class Noticia(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    titulo: str
    subtitulo: Optional[str] = None
    conteudo: str
    resumo: Optional[str] = None
    autor_id: str
    autor_nome: str
    categoria: str = "geral"  # geral, evento, promocao, regulamentacao
    fotos: List[str] = []
    video_url: Optional[HttpUrl] = None
    link_externo: Optional[HttpUrl] = None
    tags: List[str] = []
    destaque: bool = False
    publicada: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NoticiaCreate(BaseModel):
    titulo: str
    subtitulo: Optional[str] = None
    conteudo: str
    resumo: Optional[str] = None
    categoria: str = "geral"
    video_url: Optional[HttpUrl] = None
    link_externo: Optional[HttpUrl] = None
    tags: List[str] = []
    destaque: bool = False

# Dashboard Models
class DashboardStats(BaseModel):
    total_users: int
    total_membros: int
    total_parceiros: int
    total_associados: int
    candidaturas_pendentes: int
    total_imoveis: int
    total_noticias: int
    imoveis_destaque: int
    parceiros_destaque: int

class MainPageData(BaseModel):
    noticias_destaque: List[Noticia]
    imoveis_destaque: List[Imovel]
    parceiros_destaque: List[PerfilParceiro]
    ultimas_noticias: List[Noticia]

# Email Models
class EmailMassa(BaseModel):
    destinatarios: List[str]  # roles: admin, membro, parceiro, associado
    assunto: str
    mensagem: str

# Helper Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return User(**user)

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    return current_user

async def get_membro_user(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.MEMBRO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas membros podem acessar esta funcionalidade"
        )
    return current_user

async def get_parceiro_user(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.PARCEIRO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas parceiros podem acessar esta funcionalidade"
        )
    return current_user

# Email Service
async def send_email(to_email: str, subject: str, body: str, is_html: bool = False):
    try:
        print(f"Tentando enviar email para: {to_email}")
        print(f"Assunto: {subject}")
        
        msg = MIMEMultipart()
        msg['From'] = os.getenv('DEFAULT_FROM_EMAIL', os.getenv('EMAIL_HOST_USER'))
        msg['To'] = to_email
        msg['Subject'] = subject

        if is_html:
            msg.attach(MIMEText(body, 'html', 'utf-8'))
        else:
            msg.attach(MIMEText(body, 'plain', 'utf-8'))

        # Use environment variables with fallbacks
        smtp_host = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
        smtp_port = int(os.getenv('EMAIL_PORT', '587'))
        email_user = os.getenv('EMAIL_HOST_USER')
        email_password = os.getenv('EMAIL_HOST_PASSWORD')
        
        if not email_user or not email_password:
            print("Email credentials not found in environment variables")
            return False
        
        print(f"Conectando ao servidor SMTP: {smtp_host}:{smtp_port}")
        print(f"Usuario: {email_user}")
        
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(email_user, email_password)
        text = msg.as_string()
        server.sendmail(email_user, to_email, text)
        server.quit()
        
        print(f"Email enviado com sucesso para: {to_email}")
        return True
    except Exception as e:
        print(f"Erro ao enviar email: {str(e)}")
        return False

# Routes
@api_router.get("/")
async def root():
    return {"message": "ALT Ilhabela Portal API"}

# Main Page for Authenticated Users
@api_router.get("/main-page", response_model=MainPageData)
async def get_main_page_data(current_user: User = Depends(get_current_user)):
    # Get featured news (max 3)
    noticias_destaque = await db.noticias.find(
        {"publicada": True, "destaque": True}
    ).sort("created_at", -1).limit(3).to_list(length=None)
    
    # Get featured properties (max 6) - only approved ones
    imoveis_destaque = await db.imoveis.find(
        {"ativo": True, "destaque": True, "status_aprovacao": "aprovado"}
    ).sort("created_at", -1).limit(6).to_list(length=None)
    
    # Get featured partners (max 6)
    parceiros_destaque = await db.perfis_parceiros.find(
        {"ativo": True, "destaque": True}
    ).sort("created_at", -1).limit(6).to_list(length=None)
    
    # Get latest news (max 10)
    ultimas_noticias = await db.noticias.find(
        {"publicada": True}
    ).sort("created_at", -1).limit(10).to_list(length=None)
    
    return MainPageData(
        noticias_destaque=[Noticia(**n) for n in noticias_destaque],
        imoveis_destaque=[Imovel(**i) for i in imoveis_destaque],
        parceiros_destaque=[PerfilParceiro(**p) for p in parceiros_destaque],
        ultimas_noticias=[Noticia(**n) for n in ultimas_noticias]
    )

# Authentication Routes
@api_router.post("/auth/register", response_model=User)
async def register_user(user_data: UserCreate, current_user: User = Depends(get_admin_user)):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já está em uso"
        )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    del user_dict['password']
    user_obj = User(**user_dict)
    
    # Store user with hashed password
    user_doc = user_obj.dict()
    user_doc['hashed_password'] = hashed_password
    
    await db.users.insert_one(user_doc)
    return user_obj

@api_router.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user['ativo']:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Conta desativada",
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['email']}, expires_delta=access_token_expires
    )
    
    user_obj = User(**user)
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.put("/auth/alterar-senha")
async def alterar_senha(
    dados_senha: dict,
    current_user: User = Depends(get_current_user)
):
    """Change user password"""
    senha_atual = dados_senha.get("senhaAtual")
    nova_senha = dados_senha.get("novaSenha")
    
    if not senha_atual or not nova_senha:
        raise HTTPException(status_code=400, detail="Senha atual e nova senha são obrigatórias")
    
    # Get user from database to access hashed_password
    user_doc = await db.users.find_one({"id": current_user.id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Verify current password
    if not pwd_context.verify(senha_atual, user_doc["hashed_password"]):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    
    # Hash new password
    nova_senha_hash = pwd_context.hash(nova_senha)
    
    # Update password in database
    result = await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"hashed_password": nova_senha_hash}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    return {"message": "Senha alterada com sucesso"}

# Enhanced Application Routes
@api_router.post("/candidaturas/membro", response_model=CandidaturaMembro)
async def submit_candidatura_membro(candidatura: CandidaturaMembro):
    candidatura_dict = candidatura.dict()
    # Convert HttpUrl to string for MongoDB storage
    for key, value in candidatura_dict.items():
        if hasattr(value, 'scheme'):  # HttpUrl object
            candidatura_dict[key] = str(value)
    await db.candidaturas_membros.insert_one(candidatura_dict)
    return candidatura

@api_router.post("/candidaturas/parceiro", response_model=CandidaturaParceiro)
async def submit_candidatura_parceiro(candidatura: CandidaturaParceiro):
    candidatura_dict = candidatura.dict()
    # Convert HttpUrl to string for MongoDB storage
    for key, value in candidatura_dict.items():
        if hasattr(value, 'scheme'):  # HttpUrl object
            candidatura_dict[key] = str(value)
    await db.candidaturas_parceiros.insert_one(candidatura_dict)
    return candidatura

@api_router.post("/candidaturas/associado", response_model=CandidaturaAssociado)
async def submit_candidatura_associado(candidatura: CandidaturaAssociado):
    candidatura_dict = candidatura.dict()
    # Convert HttpUrl to string for MongoDB storage
    for key, value in candidatura_dict.items():
        if hasattr(value, 'scheme'):  # HttpUrl object
            candidatura_dict[key] = str(value)
    await db.candidaturas_associados.insert_one(candidatura_dict)
    return candidatura

# Enhanced Property Routes for Members
@api_router.get("/imoveis", response_model=List[Imovel])
async def get_imoveis(current_user: User = Depends(get_current_user)):
    """Get all approved properties"""
    imoveis = await db.imoveis.find({"status_aprovacao": "aprovado", "ativo": True}).sort("created_at", -1).to_list(length=None)
    
    # Remove MongoDB ObjectId from all properties
    for imovel in imoveis:
        imovel.pop("_id", None)
    
    return [Imovel(**imovel) for imovel in imoveis]

@api_router.get("/meus-imoveis", response_model=List[Imovel])
async def get_meus_imoveis(current_user: User = Depends(get_membro_user)):
    imoveis = await db.imoveis.find({"proprietario_id": current_user.id}).sort("created_at", -1).to_list(length=None)
    
    # Remove MongoDB ObjectId from all properties
    for imovel in imoveis:
        imovel.pop("_id", None)
    
    return [Imovel(**imovel) for imovel in imoveis]

@api_router.post("/imoveis", response_model=Imovel)
async def create_imovel(imovel_data: ImovelCreate, current_user: User = Depends(get_membro_user)):
    """Create new property (requires approval)"""
    imovel_dict = imovel_data.dict()
    
    # Convert empty strings to None for optional URL fields
    url_fields = ['link_booking', 'link_airbnb']
    for field in url_fields:
        if imovel_dict.get(field) == '' or imovel_dict.get(field) is None:
            imovel_dict[field] = None
        elif imovel_dict.get(field):
            # Convert HttpUrl objects to strings for MongoDB
            imovel_dict[field] = str(imovel_dict[field])
    
    # Convert fotos URLs to strings if present
    if imovel_dict.get('fotos'):
        imovel_dict['fotos'] = [str(url) for url in imovel_dict['fotos']]
    
    imovel_dict["proprietario_id"] = current_user.id
    imovel_dict["id"] = str(uuid.uuid4())
    imovel_dict["status_aprovacao"] = "pendente"  # All new properties need approval
    imovel_dict["ativo"] = True  # Properties are active by default
    imovel_dict["fotos"] = imovel_dict.get("fotos", [])  # Initialize empty photos array if not present
    imovel_dict["visualizacoes"] = 0
    imovel_dict["cliques_link"] = 0
    imovel_dict["created_at"] = datetime.now(timezone.utc)
    imovel_dict["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.imoveis.insert_one(imovel_dict)
    
    # Return the created property
    created_property = await db.imoveis.find_one({"id": imovel_dict["id"]})
    created_property.pop("_id", None)
    return Imovel(**created_property)

@api_router.get("/imoveis/{imovel_id}", response_model=Imovel)
async def get_imovel(imovel_id: str, current_user: User = Depends(get_current_user)):
    imovel = await db.imoveis.find_one({"id": imovel_id, "ativo": True})
    if not imovel:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    
    # Increment view count
    await db.imoveis.update_one(
        {"id": imovel_id},
        {"$inc": {"visualizacoes": 1}}
    )
    
    # Remove MongoDB ObjectId before returning
    imovel.pop("_id", None)
    return Imovel(**imovel)

@api_router.get("/imoveis/{imovel_id}/proprietario")
async def get_imovel_proprietario(imovel_id: str, current_user: User = Depends(get_current_user)):
    """Get property owner information (public data only)"""
    imovel = await db.imoveis.find_one({"id": imovel_id, "ativo": True})
    if not imovel:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    
    proprietario = await db.users.find_one({"id": imovel["proprietario_id"]})
    if not proprietario:
        raise HTTPException(status_code=404, detail="Proprietário não encontrado")
    
    # Return only public information
    return {
        "id": proprietario["id"],
        "nome": proprietario["nome"],
        "role": proprietario["role"]
    }

@api_router.put("/imoveis/{imovel_id}", response_model=Imovel)
async def update_imovel(
    imovel_id: str, 
    imovel_data: ImovelUpdate, 
    current_user: User = Depends(get_membro_user)
):
    # Check if property belongs to current user
    existing = await db.imoveis.find_one({"id": imovel_id, "proprietario_id": current_user.id})
    if not existing:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    
    # Update only provided fields
    update_data = {k: v for k, v in imovel_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.imoveis.update_one(
        {"id": imovel_id},
        {"$set": update_data}
    )
    
    updated_imovel = await db.imoveis.find_one({"id": imovel_id})
    return Imovel(**updated_imovel)

@api_router.delete("/imoveis/{imovel_id}")
async def delete_imovel(imovel_id: str, current_user: User = Depends(get_membro_user)):
    result = await db.imoveis.update_one(
        {"id": imovel_id, "proprietario_id": current_user.id},
        {"$set": {"ativo": False, "updated_at": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    
    return {"message": "Imóvel removido com sucesso"}

# Partner Profile Routes (Enhanced)
@api_router.get("/parceiros", response_model=List[PerfilParceiro])
async def get_parceiros(current_user: User = Depends(get_current_user)):
    parceiros = await db.perfis_parceiros.find({"ativo": True}).sort("created_at", -1).to_list(length=None)
    return [PerfilParceiro(**parceiro) for parceiro in parceiros]

@api_router.get("/meu-perfil-parceiro", response_model=PerfilParceiro)
async def get_meu_perfil_parceiro(current_user: User = Depends(get_parceiro_user)):
    perfil = await db.perfis_parceiros.find_one({"user_id": current_user.id})
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return PerfilParceiro(**perfil)

@api_router.post("/perfil-parceiro", response_model=PerfilParceiro)
async def create_perfil_parceiro(
    perfil_data: PerfilParceiroCreate, 
    current_user: User = Depends(get_parceiro_user)
):
    # Check if profile already exists
    existing = await db.perfis_parceiros.find_one({"user_id": current_user.id})
    if existing:
        raise HTTPException(status_code=400, detail="Perfil já existe")
    
    perfil = PerfilParceiro(
        user_id=current_user.id,
        **perfil_data.dict()
    )
    
    perfil_dict = perfil.dict()
    await db.perfis_parceiros.insert_one(perfil_dict)
    return perfil

@api_router.put("/perfil-parceiro", response_model=PerfilParceiro)
async def update_perfil_parceiro(
    perfil_data: PerfilParceiroCreate, 
    current_user: User = Depends(get_parceiro_user)
):
    update_data = perfil_data.dict()
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.perfis_parceiros.update_one(
        {"user_id": current_user.id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    
    updated_perfil = await db.perfis_parceiros.find_one({"user_id": current_user.id})
    return PerfilParceiro(**updated_perfil)

# Enhanced Content Management Routes
@api_router.get("/noticias", response_model=List[Noticia])
async def get_noticias(
    categoria: Optional[str] = None,
    limit: Optional[int] = 20,
    current_user: User = Depends(get_current_user)
):
    query = {"publicada": True}
    if categoria:
        query["categoria"] = categoria
    
    noticias = await db.noticias.find(query).sort("created_at", -1).limit(limit).to_list(length=None)
    return [Noticia(**noticia) for noticia in noticias]

@api_router.get("/noticias/{noticia_id}", response_model=Noticia)
async def get_noticia(noticia_id: str, current_user: User = Depends(get_current_user)):
    noticia = await db.noticias.find_one({"id": noticia_id, "publicada": True})
    if not noticia:
        raise HTTPException(status_code=404, detail="Notícia não encontrada")
    return Noticia(**noticia)

@api_router.post("/admin/noticias", response_model=Noticia)
async def create_noticia(noticia_data: NoticiaCreate, current_user: User = Depends(get_admin_user)):
    noticia = Noticia(
        titulo=noticia_data.titulo,
        subtitulo=noticia_data.subtitulo,
        conteudo=noticia_data.conteudo,
        resumo=noticia_data.resumo,
        categoria=noticia_data.categoria,
        video_url=noticia_data.video_url,
        link_externo=noticia_data.link_externo,
        tags=noticia_data.tags,
        destaque=noticia_data.destaque,
        autor_id=current_user.id,
        autor_nome=current_user.nome
    )
    
    noticia_dict = noticia.dict()
    # Convert HttpUrl to string for MongoDB storage
    for key, value in noticia_dict.items():
        if hasattr(value, 'scheme'):  # HttpUrl object
            noticia_dict[key] = str(value)
    
    await db.noticias.insert_one(noticia_dict)
    return noticia

@api_router.get("/admin/noticias", response_model=List[Noticia])
async def get_admin_noticias(current_user: User = Depends(get_admin_user)):
    noticias = await db.noticias.find({}).sort("created_at", -1).to_list(length=None)
    return [Noticia(**noticia) for noticia in noticias]

@api_router.put("/admin/noticias/{noticia_id}", response_model=Noticia)
async def update_noticia(
    noticia_id: str,
    noticia_data: NoticiaCreate,
    current_user: User = Depends(get_admin_user)
):
    update_data = noticia_data.dict()
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.noticias.update_one(
        {"id": noticia_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notícia não encontrada")
    
    updated_noticia = await db.noticias.find_one({"id": noticia_id})
    return Noticia(**updated_noticia)

@api_router.delete("/admin/noticias/{noticia_id}")
async def delete_noticia(noticia_id: str, current_user: User = Depends(get_admin_user)):
    result = await db.noticias.delete_one({"id": noticia_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notícia não encontrada")
    return {"message": "Notícia deletada com sucesso"}

# Admin Routes (Enhanced)
@api_router.get("/admin/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_admin_user)):
    # Count users by role
    total_users = await db.users.count_documents({})
    total_membros = await db.users.count_documents({"role": "membro"})
    total_parceiros = await db.users.count_documents({"role": "parceiro"})
    total_associados = await db.users.count_documents({"role": "associado"})
    
    # Count pending applications
    candidaturas_membros = await db.candidaturas_membros.count_documents({"status": "pendente"})
    candidaturas_parceiros = await db.candidaturas_parceiros.count_documents({"status": "pendente"})
    candidaturas_associados = await db.candidaturas_associados.count_documents({"status": "pendente"})
    candidaturas_pendentes = candidaturas_membros + candidaturas_parceiros + candidaturas_associados
    
    # Count content
    total_imoveis = await db.imoveis.count_documents({"ativo": True, "status_aprovacao": "aprovado"})
    total_noticias = await db.noticias.count_documents({"publicada": True})
    imoveis_destaque = await db.imoveis.count_documents({"ativo": True, "destaque": True, "status_aprovacao": "aprovado"})
    parceiros_destaque = await db.perfis_parceiros.count_documents({"ativo": True, "destaque": True})
    
    return DashboardStats(
        total_users=total_users,
        total_membros=total_membros,
        total_parceiros=total_parceiros,
        total_associados=total_associados,
        candidaturas_pendentes=candidaturas_pendentes,
        total_imoveis=total_imoveis,
        total_noticias=total_noticias,
        imoveis_destaque=imoveis_destaque,
        parceiros_destaque=parceiros_destaque
    )

@api_router.get("/admin/candidaturas/membros", response_model=List[CandidaturaMembro])
async def get_candidaturas_membros(current_user: User = Depends(get_admin_user)):
    candidaturas = await db.candidaturas_membros.find({"status": "pendente"}).to_list(length=None)
    return [CandidaturaMembro(**c) for c in candidaturas]

@api_router.get("/admin/candidaturas/parceiros", response_model=List[CandidaturaParceiro])
async def get_candidaturas_parceiros(current_user: User = Depends(get_admin_user)):
    candidaturas = await db.candidaturas_parceiros.find({"status": "pendente"}).to_list(length=None)
    return [CandidaturaParceiro(**c) for c in candidaturas]

@api_router.get("/admin/candidaturas/associados", response_model=List[CandidaturaAssociado])
async def get_candidaturas_associados(current_user: User = Depends(get_admin_user)):
    candidaturas = await db.candidaturas_associados.find({"status": "pendente"}).to_list(length=None)
    return [CandidaturaAssociado(**c) for c in candidaturas]

@api_router.post("/admin/candidaturas/{tipo}/{candidatura_id}/aprovar")
async def aprovar_candidatura(
    tipo: str, 
    candidatura_id: str, 
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_admin_user)
):
    # Find candidatura based on type
    collection_map = {
        "membro": db.candidaturas_membros,
        "parceiro": db.candidaturas_parceiros,
        "associado": db.candidaturas_associados
    }
    
    if tipo not in collection_map:
        raise HTTPException(status_code=400, detail="Tipo de candidatura inválido")
    
    collection = collection_map[tipo]
    candidatura = await collection.find_one({"id": candidatura_id})
    
    if not candidatura:
        raise HTTPException(status_code=404, detail="Candidatura não encontrada")
    
    # Generate temporary password
    temp_password = secrets.token_urlsafe(12)
    
    # Create user account
    user_data = UserCreate(
        email=candidatura['email'],
        nome=candidatura['nome'],
        telefone=candidatura['telefone'],
        role=tipo,
        password=temp_password
    )
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Usuário já existe")
    
    # Create user
    hashed_password = get_password_hash(temp_password)
    user_obj = User(
        email=user_data.email,
        nome=user_data.nome,
        telefone=user_data.telefone,
        role=user_data.role
    )
    
    user_doc = user_obj.dict()
    user_doc['hashed_password'] = hashed_password
    
    await db.users.insert_one(user_doc)
    
    # Update candidatura status
    await collection.update_one(
        {"id": candidatura_id},
        {"$set": {"status": "aprovado"}}
    )
    
    # Send welcome email
    subject = "Bem-vindo à ALT Ilhabela!"
    body = f"""
    Olá {candidatura['nome']},
    
    Sua candidatura foi aprovada! Bem-vindo à Associação de Locação por Temporada de Ilhabela.
    
    Suas credenciais de acesso:
    Email: {candidatura['email']}
    Senha temporária: {temp_password}
    
    Por favor, faça login e altere sua senha no primeiro acesso.
    
    Link de acesso: https://temp-housing.preview.emergentagent.com/login
    
    Atenciosamente,
    Equipe ALT Ilhabela
    """
    
    background_tasks.add_task(send_email, candidatura['email'], subject, body)
    
    return {"message": "Candidatura aprovada com sucesso", "temp_password": temp_password}

@api_router.post("/admin/candidaturas/{tipo}/{candidatura_id}/recusar")
async def recusar_candidatura(
    tipo: str, 
    candidatura_id: str, 
    background_tasks: BackgroundTasks,
    motivo: str = "",
    current_user: User = Depends(get_admin_user)
):
    collection_map = {
        "membro": db.candidaturas_membros,
        "parceiro": db.candidaturas_parceiros,
        "associado": db.candidaturas_associados
    }
    
    if tipo not in collection_map:
        raise HTTPException(status_code=400, detail="Tipo de candidatura inválido")
    
    collection = collection_map[tipo]
    candidatura = await collection.find_one({"id": candidatura_id})
    
    if not candidatura:
        raise HTTPException(status_code=404, detail="Candidatura não encontrada")
    
    # Update candidatura status
    await collection.update_one(
        {"id": candidatura_id},
        {"$set": {"status": "recusado", "motivo_recusa": motivo}}
    )
    
    # Send rejection email
    subject = "Atualização sobre sua candidatura - ALT Ilhabela"
    body = f"""
    Olá {candidatura['nome']},
    
    Agradecemos seu interesse em fazer parte da ALT Ilhabela.
    
    Infelizmente, não foi possível aprovar sua candidatura neste momento.
    
    {f'Motivo: {motivo}' if motivo else ''}
    
    Você pode submeter uma nova candidatura no futuro.
    
    Atenciosamente,
    Equipe ALT Ilhabela
    """
    
    background_tasks.add_task(send_email, candidatura['email'], subject, body)
    
    return {"message": "Candidatura recusada"}

# Communication Routes
@api_router.post("/admin/email-massa")
async def enviar_email_massa(
    email_data: EmailMassa, 
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_admin_user)
):
    # Get users by roles
    user_emails = []
    for role in email_data.destinatarios:
        if role == "todos":
            users = await db.users.find({"ativo": True}).to_list(length=None)
        else:
            users = await db.users.find({"role": role, "ativo": True}).to_list(length=None)
        
        for user in users:
            if user['email'] not in user_emails:
                user_emails.append(user['email'])
    
    # Send emails
    for email in user_emails:
        background_tasks.add_task(send_email, email, email_data.assunto, email_data.mensagem)
    
    return {"message": f"Email enviado para {len(user_emails)} usuários", "destinatarios": len(user_emails)}

# User Management Routes
@api_router.get("/admin/users", response_model=List[User])
async def get_all_users(current_user: User = Depends(get_admin_user)):
    users = await db.users.find({}).to_list(length=None)
    return [User(**user) for user in users]

@api_router.put("/admin/users/{user_id}")
async def update_user(
    user_id: str, 
    user_updates: dict, 
    current_user: User = Depends(get_admin_user)
):
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": user_updates}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"message": "Usuário atualizado com sucesso"}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_admin_user)):
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"ativo": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"message": "Usuário desativado com sucesso"}

# Property Approval Routes (Admin)
@api_router.get("/admin/imoveis-pendentes", response_model=List[Imovel])
async def get_imoveis_pendentes(current_user: User = Depends(get_admin_user)):
    """Get all properties pending approval"""
    imoveis = await db.imoveis.find({"status_aprovacao": "pendente"}).to_list(length=None)
    
    # Remove MongoDB ObjectId from all properties
    for imovel in imoveis:
        imovel.pop("_id", None)
    
    return [Imovel(**imovel) for imovel in imoveis]

@api_router.post("/admin/imoveis/{imovel_id}/aprovar")
async def aprovar_imovel(imovel_id: str, current_user: User = Depends(get_admin_user)):
    """Approve property"""
    # Update property status
    result = await db.imoveis.update_one(
        {"id": imovel_id},
        {"$set": {"status_aprovacao": "aprovado", "updated_at": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    
    # Get property and owner info for notification
    imovel = await db.imoveis.find_one({"id": imovel_id})
    owner = await db.users.find_one({"id": imovel["proprietario_id"]})
    
    # Send notification email
    if owner and owner.get("email"):
        try:
            await send_email(
                to_email=owner["email"],
                subject="Imóvel Aprovado - ALT Ilhabela",
                body=f"""
Olá {owner.get('nome', 'Proprietário')},

Ótimas notícias! Seu imóvel "{imovel['titulo']}" foi aprovado e já está disponível no portal da ALT Ilhabela.

Seu imóvel agora pode ser visualizado por outros membros e turistas que acessam nossa plataforma.

Para gerenciar seus imóveis, acesse: https://temporada-portal.preview.emergentagent.com/login

Atenciosamente,
Equipe ALT Ilhabela
                """
            )
        except Exception as e:
            print(f"Erro ao enviar email de aprovação: {e}")
    
    return {"message": "Imóvel aprovado com sucesso"}

@api_router.post("/admin/imoveis/{imovel_id}/recusar")
async def recusar_imovel(
    imovel_id: str, 
    motivo: str = "", 
    current_user: User = Depends(get_admin_user)
):
    """Reject property"""
    # Update property status
    result = await db.imoveis.update_one(
        {"id": imovel_id},
        {"$set": {"status_aprovacao": "recusado", "updated_at": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    
    # Get property and owner info for notification
    imovel = await db.imoveis.find_one({"id": imovel_id})
    owner = await db.users.find_one({"id": imovel["proprietario_id"]})
    
    # Send notification email
    if owner and owner.get("email"):
        try:
            await send_email(
                to_email=owner["email"],
                subject="Imóvel Não Aprovado - ALT Ilhabela",
                body=f"""
Olá {owner.get('nome', 'Proprietário')},

Infelizmente, seu imóvel "{imovel['titulo']}" não foi aprovado para publicação no portal da ALT Ilhabela.

{f'Motivo: {motivo}' if motivo else ''}

Você pode revisar as informações e enviar uma nova solicitação através da sua área de membros.

Para mais informações, entre em contato conosco.

Atenciosamente,
Equipe ALT Ilhabela
                """
            )
        except Exception as e:
            print(f"Erro ao enviar email de recusa: {e}")
    
    return {"message": "Imóvel recusado com sucesso"}

# File Upload Routes
@api_router.post("/upload/foto")
async def upload_foto(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload photo for properties or partners"""
    
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="Arquivo inválido")
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Tipo de arquivo não permitido. Use: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Máximo 10MB.")
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    filename = f"{file_id}{file_ext}"
    file_path = UPLOAD_DIR / filename
    
    # Save file
    try:
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao salvar arquivo")
    
    # Return file URL with /api prefix for proper routing
    file_url = f"/api/uploads/{filename}"
    return {"url": file_url, "filename": filename}

@api_router.delete("/upload/foto/{filename}")
async def delete_foto(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """Delete uploaded photo"""
    file_path = UPLOAD_DIR / filename
    
    try:
        if file_path.exists():
            file_path.unlink()
        return {"message": "Foto removida com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao remover foto")

# Admin - Toggle Featured Content
@api_router.put("/admin/imoveis/{imovel_id}/destaque")
async def toggle_imovel_destaque(
    imovel_id: str,
    destaque: bool,
    current_user: User = Depends(get_admin_user)
):
    result = await db.imoveis.update_one(
        {"id": imovel_id},
        {"$set": {"destaque": destaque, "updated_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    return {"message": f"Imóvel {'adicionado ao' if destaque else 'removido do'} destaque"}

@api_router.put("/admin/parceiros/{parceiro_id}/destaque")
async def toggle_parceiro_destaque(
    parceiro_id: str,
    destaque: bool,
    current_user: User = Depends(get_admin_user)
):
    result = await db.perfis_parceiros.update_one(
        {"id": parceiro_id},
        {"$set": {"destaque": destaque, "updated_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    return {"message": f"Parceiro {'adicionado ao' if destaque else 'removido do'} destaque"}

# Include router in app
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()