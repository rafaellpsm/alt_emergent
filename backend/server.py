from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
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

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

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

# Application Models
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
    status: str = Field(default="pendente")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CandidaturaParceiro(CandidaturaBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tipo: str = Field(default="parceiro")
    nome_empresa: str
    categoria: str  # Restaurante, Turismo, etc.
    website: Optional[str] = None
    status: str = Field(default="pendente")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CandidaturaAssociado(CandidaturaBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tipo: str = Field(default="associado")
    ocupacao: str
    motivo_interesse: str
    status: str = Field(default="pendente")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Property Models
class Imovel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    titulo: str
    descricao: str
    tipo: str  # Casa, Apartamento, etc.
    regiao: str
    preco_diaria: float
    num_quartos: int
    num_banheiros: int
    capacidade: int
    fotos: List[str] = []
    ativo: bool = True
    proprietario_id: str
    visualizacoes: int = 0
    cliques_link: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ImovelCreate(BaseModel):
    titulo: str
    descricao: str
    tipo: str
    regiao: str
    preco_diaria: float
    num_quartos: int
    num_banheiros: int
    capacidade: int

# Partner Profile Models
class PerfilParceiro(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    nome_empresa: str
    descricao: str
    categoria: str
    telefone: str
    website: Optional[str] = None
    fotos: List[str] = []
    ativo: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PerfilParceiroCreate(BaseModel):
    nome_empresa: str
    descricao: str
    categoria: str
    telefone: str
    website: Optional[str] = None

# Content Models
class Noticia(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    titulo: str
    conteudo: str
    autor_id: str
    autor_nome: str
    publicada: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NoticiaCreate(BaseModel):
    titulo: str
    conteudo: str

# Email Models
class EmailMassa(BaseModel):
    destinatarios: List[str]  # roles: admin, membro, parceiro, associado
    assunto: str
    mensagem: str

# Dashboard Stats
class DashboardStats(BaseModel):
    total_users: int
    total_membros: int
    total_parceiros: int
    total_associados: int
    candidaturas_pendentes: int
    total_imoveis: int
    total_noticias: int

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

# Email Service
async def send_email(to_email: str, subject: str, body: str, is_html: bool = False):
    try:
        msg = MIMEMultipart()
        msg['From'] = os.getenv('EMAIL_HOST_USER')
        msg['To'] = to_email
        msg['Subject'] = subject

        if is_html:
            msg.attach(MIMEText(body, 'html', 'utf-8'))
        else:
            msg.attach(MIMEText(body, 'plain', 'utf-8'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(os.getenv('EMAIL_HOST_USER'), os.getenv('EMAIL_HOST_PASSWORD'))
        text = msg.as_string()
        server.sendmail(os.getenv('EMAIL_HOST_USER'), to_email, text)
        server.quit()
        return True
    except Exception as e:
        logging.error(f"Error sending email: {str(e)}")
        return False

# Routes
@api_router.get("/")
async def root():
    return {"message": "ALT Ilhabela Portal API"}

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

# Application Routes
@api_router.post("/candidaturas/membro", response_model=CandidaturaMembro)
async def submit_candidatura_membro(candidatura: CandidaturaMembro):
    candidatura_dict = candidatura.dict()
    await db.candidaturas_membros.insert_one(candidatura_dict)
    return candidatura

@api_router.post("/candidaturas/parceiro", response_model=CandidaturaParceiro)
async def submit_candidatura_parceiro(candidatura: CandidaturaParceiro):
    candidatura_dict = candidatura.dict()
    await db.candidaturas_parceiros.insert_one(candidatura_dict)
    return candidatura

@api_router.post("/candidaturas/associado", response_model=CandidaturaAssociado)
async def submit_candidatura_associado(candidatura: CandidaturaAssociado):
    candidatura_dict = candidatura.dict()
    await db.candidaturas_associados.insert_one(candidatura_dict)
    return candidatura

# Admin Routes
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
    total_imoveis = await db.imoveis.count_documents({"ativo": True})
    total_noticias = await db.noticias.count_documents({"publicada": True})
    
    return DashboardStats(
        total_users=total_users,
        total_membros=total_membros,
        total_parceiros=total_parceiros,
        total_associados=total_associados,
        candidaturas_pendentes=candidaturas_pendentes,
        total_imoveis=total_imoveis,
        total_noticias=total_noticias
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
    
    Link de acesso: https://temporada-portal.preview.emergentagent.com/login
    
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

# Content Management Routes
@api_router.get("/noticias", response_model=List[Noticia])
async def get_noticias(current_user: User = Depends(get_current_user)):
    noticias = await db.noticias.find({"publicada": True}).sort("created_at", -1).to_list(length=20)
    return [Noticia(**noticia) for noticia in noticias]

@api_router.post("/admin/noticias", response_model=Noticia)
async def create_noticia(noticia_data: NoticiaCreate, current_user: User = Depends(get_admin_user)):
    noticia = Noticia(
        titulo=noticia_data.titulo,
        conteudo=noticia_data.conteudo,
        autor_id=current_user.id,
        autor_nome=current_user.nome
    )
    
    noticia_dict = noticia.dict()
    await db.noticias.insert_one(noticia_dict)
    return noticia

@api_router.get("/admin/noticias", response_model=List[Noticia])
async def get_admin_noticias(current_user: User = Depends(get_admin_user)):
    noticias = await db.noticias.find({}).sort("created_at", -1).to_list(length=None)
    return [Noticia(**noticia) for noticia in noticias]

@api_router.delete("/admin/noticias/{noticia_id}")
async def delete_noticia(noticia_id: str, current_user: User = Depends(get_admin_user)):
    result = await db.noticias.delete_one({"id": noticia_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notícia não encontrada")
    return {"message": "Notícia deletada com sucesso"}

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

# Member Property Routes
@api_router.get("/imoveis", response_model=List[Imovel])
async def get_imoveis(current_user: User = Depends(get_current_user)):
    imoveis = await db.imoveis.find({"ativo": True}).to_list(length=None)
    return [Imovel(**imovel) for imovel in imoveis]

@api_router.get("/meus-imoveis", response_model=List[Imovel])
async def get_meus_imoveis(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.MEMBRO:
        raise HTTPException(status_code=403, detail="Apenas membros podem acessar imóveis")
    
    imoveis = await db.imoveis.find({"proprietario_id": current_user.id}).to_list(length=None)
    return [Imovel(**imovel) for imovel in imoveis]

@api_router.post("/imoveis", response_model=Imovel)
async def create_imovel(imovel_data: ImovelCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.MEMBRO:
        raise HTTPException(status_code=403, detail="Apenas membros podem cadastrar imóveis")
    
    imovel = Imovel(
        proprietario_id=current_user.id,
        **imovel_data.dict()
    )
    
    imovel_dict = imovel.dict()
    await db.imoveis.insert_one(imovel_dict)
    return imovel

@api_router.put("/imoveis/{imovel_id}", response_model=Imovel)
async def update_imovel(
    imovel_id: str, 
    imovel_data: ImovelCreate, 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.MEMBRO:
        raise HTTPException(status_code=403, detail="Apenas membros podem editar imóveis")
    
    # Check if property belongs to current user
    existing = await db.imoveis.find_one({"id": imovel_id, "proprietario_id": current_user.id})
    if not existing:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    
    result = await db.imoveis.update_one(
        {"id": imovel_id},
        {"$set": imovel_data.dict()}
    )
    
    updated_imovel = await db.imoveis.find_one({"id": imovel_id})
    return Imovel(**updated_imovel)

@api_router.delete("/imoveis/{imovel_id}")
async def delete_imovel(imovel_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.MEMBRO:
        raise HTTPException(status_code=403, detail="Apenas membros podem deletar imóveis")
    
    result = await db.imoveis.update_one(
        {"id": imovel_id, "proprietario_id": current_user.id},
        {"$set": {"ativo": False}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    
    return {"message": "Imóvel removido com sucesso"}

# Partner Profile Routes
@api_router.get("/parceiros", response_model=List[PerfilParceiro])
async def get_parceiros(current_user: User = Depends(get_current_user)):
    parceiros = await db.perfis_parceiros.find({"ativo": True}).to_list(length=None)
    return [PerfilParceiro(**parceiro) for parceiro in parceiros]

@api_router.get("/meu-perfil-parceiro", response_model=PerfilParceiro)
async def get_meu_perfil_parceiro(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.PARCEIRO:
        raise HTTPException(status_code=403, detail="Apenas parceiros podem acessar perfil")
    
    perfil = await db.perfis_parceiros.find_one({"user_id": current_user.id})
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return PerfilParceiro(**perfil)

@api_router.post("/perfil-parceiro", response_model=PerfilParceiro)
async def create_perfil_parceiro(
    perfil_data: PerfilParceiroCreate, 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.PARCEIRO:
        raise HTTPException(status_code=403, detail="Apenas parceiros podem criar perfil")
    
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
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.PARCEIRO:
        raise HTTPException(status_code=403, detail="Apenas parceiros podem editar perfil")
    
    result = await db.perfis_parceiros.update_one(
        {"user_id": current_user.id},
        {"$set": perfil_data.dict()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    
    updated_perfil = await db.perfis_parceiros.find_one({"user_id": current_user.id})
    return PerfilParceiro(**updated_perfil)

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