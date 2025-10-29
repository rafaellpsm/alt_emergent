# ==============================================================================
# App Initialization and Configuration
# ==============================================================================

# CORREÇÃO: Adicionado 'Body' à importação do FastAPI
from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, BackgroundTasks, File, UploadFile, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# CORREÇÃO: StaticFiles não é mais necessário para uploads
# from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, HttpUrl, field_validator, ValidationError
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
import string
import aiofiles

# --- NOVA IMPORTAÇÃO DO CLOUDINARY ---
import cloudinary
import cloudinary.uploader

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# --- Main App Creation (ONCE ONLY) ---
app = FastAPI(title="ALT Ilhabela Portal", version="1.0.0")
api_router = APIRouter(prefix="/api")

# --- Database Connection ---
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'alt_ilhabela')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# --- NOVA CONFIGURAÇÃO DO CLOUDINARY ---
# O Cloudinary vai ler a variável de ambiente CLOUDINARY_URL automaticamente
# Certifica-te de que definiste a CLOUDINARY_URL=cloudinary://... no teu ambiente
cloudinary.config(
    secure=True  # Garante que as URLs retornadas sejam sempre HTTPS
)
logging.info("Cloudinary configurado.")

# --- Upload Configuration (REMOVIDO) ---
# A pasta UPLOAD_DIR não é mais necessária, pois tudo vai para a nuvem.
# UPLOAD_DIR = ROOT_DIR / "uploads"
# UPLOAD_DIR.mkdir(exist_ok=True)
# ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp",
#                       ".heic", ".heif", ".mp4", ".mov", ".avi", ".mkv"}
# MAX_FILE_SIZE = 500 * 1024 * 1024

# --- Security and Authentication Configuration ---
SECRET_KEY = os.getenv("SECRET_KEY", "SUPER_SECRET_KEY_2004")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# ==============================================================================
# Pydantic Models
# ==============================================================================
# (Nenhuma alteração nos modelos Pydantic, eles continuam iguais...)
# ... (todo o teu código de Pydantic Models vai aqui) ...


class UserRole:
    ADMIN = "admin"
    ASSOCIADO = "associado"
    MEMBRO = "membro"
    PARCEIRO = "parceiro"


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    nome: str
    telefone: Optional[str] = None
    role: str
    ativo: bool = True
    descricao: Optional[str] = None
    foto_url: Optional[str] = None
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc))


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
    link_imovel: Optional[HttpUrl] = None
    experiencia_locacao: Optional[str] = None
    renda_mensal_estimada: Optional[float] = None
    possui_alvara: bool = False
    status: str = Field(default="pendente")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc))


class CandidaturaParceiro(CandidaturaBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tipo: str = Field(default="parceiro")
    nome_empresa: str
    categoria: str
    website: Optional[HttpUrl] = None
    link_empresa: Optional[str] = None
    cnpj: Optional[str] = None
    tempo_operacao: Optional[str] = None
    servicos_oferecidos: Optional[str] = None
    capacidade_atendimento: Optional[str] = None
    status: str = Field(default="pendente")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc))


class CandidaturaAssociado(CandidaturaBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tipo: str = Field(default="associado")
    ocupacao: str
    motivo_interesse: str
    empresa_trabalho: Optional[str] = None
    linkedin: Optional[str] = None
    contribuicao_pretendida: Optional[str] = None
    disponibilidade: Optional[str] = None
    status: str = Field(default="pendente")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc))

# Enhanced Property Models


class Imovel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
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
    fotos: List[str] = []
    video_url: Optional[str] = None
    link_booking: Optional[str] = None
    link_airbnb: Optional[str] = None
    status_aprovacao: str = Field(default="pendente")
    ativo: bool = True
    destaque: bool = False
    proprietario_id: str
    visualizacoes: int = 0
    cliques_link: int = 0
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc))

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
    fotos: Optional[List[str]] = None
    video_url: Optional[str] = None
    link_booking: Optional[str] = None
    link_airbnb: Optional[str] = None


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
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    whatsapp: Optional[str] = None
    fotos: List[str] = []
    video_url: Optional[str] = None
    horario_funcionamento: Optional[str] = None
    servicos_oferecidos: Optional[str] = None
    preco_medio: Optional[str] = None
    aceita_cartao: bool = True
    delivery: bool = False
    destaque: bool = False
    ativo: bool = True
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc))


class PerfilParceiroCreate(BaseModel):
    nome_empresa: str
    descricao: str
    categoria: str
    telefone: str
    endereco: Optional[str] = None
    website: Optional[HttpUrl] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    whatsapp: Optional[str] = None
    horario_funcionamento: Optional[str] = None
    servicos_oferecidos: Optional[str] = None
    fotos: List[str] = []
    video_url: Optional[str] = None

# Enhanced Content Models


class Noticia(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    titulo: str
    subtitulo: Optional[str] = None
    conteudo: str
    resumo: Optional[str] = None
    autor_id: str
    autor_nome: str
    categoria: str = "geral"
    fotos: List[str] = []
    video_url: Optional[str] = None
    link_externo: Optional[str] = None
    tags: List[str] = []
    destaque: bool = False
    publicada: bool = True
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc))


class NoticiaCreate(BaseModel):
    titulo: str
    subtitulo: Optional[str] = None
    conteudo: str
    resumo: Optional[str] = None
    categoria: str = "geral"
    # CORREÇÃO: Adicionado o campo 'fotos' que estava em falta
    fotos: List[str] = []
    video_url: Optional[str] = None
    link_externo: Optional[str] = None
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
    destinatarios: List[str]
    assunto: str
    mensagem: str

# ==============================================================================
# Helper Functions & Security
# ==============================================================================
# (Nenhuma alteração aqui, exceto a remoção da função de salvar local)
# ... (todo o teu código de Helpers & Security vai aqui) ...


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + \
            timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
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

# ==============================================================================
# Email Service
# ==============================================================================
# (Nenhuma alteração aqui)
# ... (todo o teu código do Email Service vai aqui) ...


def create_praia_email_html(titulo: str, pre_cabecalho: str, nome_usuario: str, corpo_mensagem: str, texto_botao: Optional[str] = None, url_botao: Optional[str] = None) -> str:
    """
    Gera um template de e-mail HTML com um tema praiano.
    """
    html_content = f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{titulo}</title>
        <style>
            body {{ margin: 0; padding: 0; background-color: #f4f7f6; font-family: Arial, sans-serif; }}
            .container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }}
            .header {{ background-color: #459894; color: white; padding: 30px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 28px; }}
            .content {{ padding: 30px; color: #4A5568; line-height: 1.7; }}
            .content p {{ margin: 0 0 15px 0; }}
            .button-container {{ text-align: center; margin: 30px 0; }}
            .button {{ background-color: #BFBC8A; color: #ffffff; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; }}
            .footer {{ background-color: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #718096; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1>ALT Ilhabela</h1></div>
            <div class="content">
                <p style="font-size: 18px; font-weight: bold;">Olá, {nome_usuario}!</p>
                {corpo_mensagem}
            </div>
            """
    if texto_botao and url_botao:
        html_content += f'<div class="button-container"><a href="{url_botao}" class="button">{texto_botao}</a></div>'
    html_content += """
            <div class="footer">
                <p>ALT - Associação de Locação por Temporada de Ilhabela</p>
                <p>Este é um e-mail automático, por favor não responda.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return html_content


def generate_random_password(length=8):
    characters = string.ascii_letters + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))


async def send_email(to_email: str, subject: str, body: str, html_body: Optional[str] = None):
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = os.getenv('DEFAULT_FROM_EMAIL',
                                os.getenv('EMAIL_HOST_USER'))
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        if html_body:
            msg.attach(MIMEText(html_body, 'html', 'utf-8'))
        smtp_host = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
        smtp_port = int(os.getenv('EMAIL_PORT', '587'))
        email_user = os.getenv('EMAIL_HOST_USER')
        email_password = os.getenv('EMAIL_HOST_PASSWORD')
        if not email_user or not email_password:
            logging.error(
                "Email credentials not found in environment variables")
            return False
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(email_user, email_password)
        text = msg.as_string()
        server.sendmail(email_user, to_email, text)
        server.quit()
        logging.info(f"Email sent successfully to: {to_email}")
        return True
    except Exception as e:
        logging.error(f"Error sending email: {str(e)}")
        return False

# ==============================================================================
# API Routes
# ==============================================================================
# (A maior parte das rotas continua igual. Apenas as rotas de upload e perfil de usuário foram alteradas)
# ... (todo o teu código de API Routes vai aqui, com as exceções abaixo) ...


@api_router.get("/")
async def root():
    return {"message": "ALT Ilhabela Portal API"}


@api_router.get("/main-page", response_model=MainPageData)
async def get_main_page_data():
    try:
        noticias_destaque_data = await db.noticias.find(
            {"destaque": True, "publicada": True}
        ).sort("created_at", -1).limit(3).to_list(length=None)

        imoveis_destaque_data = await db.imoveis.find(
            {"destaque": True, "ativo": True, "status_aprovacao": "aprovado"}
        ).sort("created_at", -1).limit(6).to_list(length=None)
        parceiros_destaque_data = await db.perfis_parceiros.find(
            {"destaque": True, "ativo": True}
        ).sort("created_at", -1).limit(6).to_list(length=None)

        ultimas_noticias_data = await db.noticias.find(
            {"publicada": True}
        ).sort("created_at", -1).limit(5).to_list(length=None)

        def _safe_model_init(model, data_list):
            valid_items = []
            for item_data in data_list:
                try:
                    valid_items.append(model(**item_data))
                except ValidationError as e:
                    logging.warning(
                        f"Skipping invalid data for model {model.__name__} (ID: {item_data.get('id')}): {e}")
            return valid_items

        return MainPageData(
            noticias_destaque=_safe_model_init(
                Noticia, noticias_destaque_data),
            imoveis_destaque=_safe_model_init(Imovel, imoveis_destaque_data),
            parceiros_destaque=_safe_model_init(
                PerfilParceiro, parceiros_destaque_data),
            ultimas_noticias=_safe_model_init(Noticia, ultimas_noticias_data),
        )

    except Exception as e:
        logging.error(f"Erro inesperado na rota /main-page: {e}")
        raise HTTPException(
            status_code=500, detail="Ocorreu um erro interno ao buscar os dados da página principal.")


@api_router.post("/auth/register", response_model=User)
async def register_user(user_data: UserCreate, current_user: User = Depends(get_admin_user)):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email já está em uso")

    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    del user_dict['password']
    user_obj = User(**user_dict)

    user_doc = user_obj.dict()
    user_doc['hashed_password'] = hashed_password
    await db.users.insert_one(user_doc)
    return user_obj


@api_router.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user.get('hashed_password', '')):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Email ou senha incorretos", headers={"WWW-Authenticate": "Bearer"})

    if not user.get('ativo', False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Conta desativada")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['email']}, expires_delta=access_token_expires)
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
        raise HTTPException(
            status_code=400, detail="Senha atual e nova senha são obrigatórias")

    user_doc = await db.users.find_one({"id": current_user.id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if not pwd_context.verify(senha_atual, user_doc["hashed_password"]):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")

    nova_senha_hash = pwd_context.hash(nova_senha)

    result = await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"hashed_password": nova_senha_hash}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    return {"message": "Senha alterada com sucesso"}


@api_router.post("/auth/recuperar-senha")
async def recuperar_senha(dados_email: dict):
    email = dados_email.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email é obrigatório")

    user = await db.users.find_one({"email": email.lower()})
    if not user:
        return {"message": "Se o email estiver cadastrado, você receberá instruções de recuperação"}

    nova_senha = generate_random_password(10)
    nova_senha_hash = pwd_context.hash(nova_senha)
    await db.users.update_one({"id": user["id"]}, {"$set": {"hashed_password": nova_senha_hash}})

    body_plain = f"""Olá {user.get('nome', 'Usuário')}, etc..."""
    body_html_content = f"""<p>Sua nova senha é: <strong>{nova_senha}</strong></p>"""
    html_email = create_praia_email_html(
        titulo="Recuperação de Senha",
        pre_cabecalho="Sua nova senha de acesso.",
        nome_usuario=user.get('nome', 'Usuário'),
        corpo_mensagem=body_html_content,
        texto_botao="Acessar o Portal",
        url_botao="https://temporada-portal.preview.emergentagent.com/login"
    )
    await send_email(to_email=email, subject="Recuperação de Senha",
                     body=body_plain, html_body=html_email)
    return {"message": "Instruções enviadas para o seu email."}


@api_router.post("/candidaturas/membro", response_model=CandidaturaMembro)
async def submit_candidatura_membro(candidatura: CandidaturaMembro):
    existing_user = await db.users.find_one({"email": candidatura.email})
    existing_candidatura = await db.candidaturas_membros.find_one({"email": candidatura.email, "status": "pendente"})
    if existing_user or existing_candidatura:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O email já se encontra registado ou com uma candidatura pendente."
        )
    candidatura_dict = candidatura.dict()
    for key, value in candidatura_dict.items():
        if hasattr(value, 'scheme'):
            candidatura_dict[key] = str(value)
    await db.candidaturas_membros.insert_one(candidatura_dict)
    return candidatura


@api_router.post("/candidaturas/parceiro", response_model=CandidaturaParceiro)
async def submit_candidatura_parceiro(candidatura: CandidaturaParceiro):
    existing_user = await db.users.find_one({"email": candidatura.email})
    existing_candidatura = await db.candidaturas_parceiros.find_one({"email": candidatura.email, "status": "pendente"})
    if existing_user or existing_candidatura:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O email já se encontra registado ou com uma candidatura pendente."
        )
    candidatura_dict = candidatura.dict()
    for key, value in candidatura_dict.items():
        if hasattr(value, 'scheme'):
            candidatura_dict[key] = str(value)
    await db.candidaturas_parceiros.insert_one(candidatura_dict)
    return candidatura


@api_router.post("/candidaturas/associado", response_model=CandidaturaAssociado)
async def submit_candidatura_associado(candidatura: CandidaturaAssociado):
    existing_user = await db.users.find_one({"email": candidatura.email})
    existing_candidatura = await db.candidaturas_associados.find_one({"email": candidatura.email, "status": "pendente"})
    if existing_user or existing_candidatura:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O email já se encontra registado ou com uma candidatura pendente."
        )
    candidatura_dict = candidatura.dict()
    for key, value in candidatura_dict.items():
        if hasattr(value, 'scheme'):
            candidatura_dict[key] = str(value)
    await db.candidaturas_associados.insert_one(candidatura_dict)
    return candidatura


@api_router.get("/imoveis", response_model=List[Imovel])
async def get_imoveis(
    tipo: Optional[str] = None,
    regiao: Optional[str] = None,
    preco_max: Optional[float] = None,
    num_quartos: Optional[int] = None,
    possui_piscina: Optional[bool] = None,
    permite_pets: Optional[bool] = None
):
    query = {"status_aprovacao": "aprovado", "ativo": True}
    if tipo and tipo != 'todos':
        query["tipo"] = tipo
    if regiao and regiao != 'todas':
        query["regiao"] = regiao
    if preco_max is not None and preco_max > 0:
        query["preco_diaria"] = {"$lte": preco_max}
    if num_quartos is not None and num_quartos > 0:
        query["num_quartos"] = {"$gte": num_quartos}
    if possui_piscina:
        query["possui_piscina"] = True
    if permite_pets:
        query["permite_pets"] = True
    imoveis_cursor = db.imoveis.find(query).sort("created_at", -1)
    imoveis = await imoveis_cursor.to_list(length=None)
    valid_imoveis = []
    for imovel_data in imoveis:
        imovel_data.pop("_id", None)
        try:
            valid_imoveis.append(Imovel(**imovel_data))
        except ValidationError as e:
            print(
                f"Skipping invalid property data (ID: {imovel_data.get('id')}): {e}")
    return valid_imoveis


@api_router.get("/meus-imoveis", response_model=List[Imovel])
async def get_meus_imoveis(current_user: User = Depends(get_membro_user)):
    imoveis = await db.imoveis.find(
        {"proprietario_id": current_user.id, "ativo": True}
    ).sort("created_at", -1).to_list(length=None)
    for imovel in imoveis:
        imovel.pop("_id", None)
    return [Imovel(**imovel) for imovel in imoveis]


@api_router.post("/imoveis", response_model=Imovel)
async def create_imovel(imovel_data: ImovelCreate, current_user: User = Depends(get_membro_user)):
    imovel_dict = imovel_data.dict()
    url_fields = ['link_booking', 'link_airbnb']
    for field in url_fields:
        if imovel_dict.get(field) == '' or imovel_dict.get(field) is None:
            imovel_dict[field] = None
        elif imovel_dict.get(field):
            imovel_dict[field] = str(imovel_dict[field])
    if imovel_dict.get('fotos'):
        imovel_dict['fotos'] = [str(url) for url in imovel_dict['fotos']]
    imovel_dict.update({
        "proprietario_id": current_user.id,
        "id": str(uuid.uuid4()),
        "status_aprovacao": "pendente",
        "ativo": True,
        "fotos": imovel_dict.get("fotos", []),
        "visualizacoes": 0,
        "cliques_link": 0,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    })
    await db.imoveis.insert_one(imovel_dict)
    created_property = await db.imoveis.find_one({"id": imovel_dict["id"]})
    created_property.pop("_id", None)
    return Imovel(**created_property)


@api_router.get("/imoveis/{imovel_id}", response_model=Imovel)
async def get_imovel(imovel_id: str):
    imovel = await db.imoveis.find_one({"id": imovel_id, "ativo": True})
    if not imovel:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    await db.imoveis.update_one({"id": imovel_id}, {"$inc": {"visualizacoes": 1}})
    imovel.pop("_id", None)
    return Imovel(**imovel)


@api_router.get("/imoveis/{imovel_id}/proprietario")
async def get_imovel_proprietario(imovel_id: str, current_user: User = Depends(get_current_user)):
    imovel = await db.imoveis.find_one({"id": imovel_id, "ativo": True})
    if not imovel:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    proprietario = await db.users.find_one({"id": imovel["proprietario_id"]})
    if not proprietario:
        raise HTTPException(
            status_code=404, detail="Proprietário não encontrado")
    return {"id": proprietario["id"], "nome": proprietario["nome"], "role": proprietario["role"]}


@api_router.get("/usuarios/{user_id}/perfil-publico")
async def get_perfil_publico(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    imoveis = await db.imoveis.find(
        {"proprietario_id": user_id, "ativo": True, "status_aprovacao": "aprovado"}
    ).sort("created_at", -1).to_list(length=None)
    for imovel in imoveis:
        imovel.pop("_id", None)
    return {"id": user["id"], "nome": user["nome"], "telefone": user.get("telefone"),
            "role": user.get("role"), "imoveis": imoveis}


# --- ROTA ATUALIZAR PERFIL MODIFICADA ---
@api_router.put("/usuarios/{user_id}/perfil")
async def atualizar_perfil(
    user_id: str,
    descricao: str = Form(None),
    foto: UploadFile = File(None),
    current_user: User = Depends(get_current_user)
):
    if user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Não autorizado a editar este perfil")
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    update_data = {}
    if descricao is not None:
        update_data["descricao"] = descricao

    if foto:
        # Fazer upload para o Cloudinary em vez de salvar localmente
        try:
            # Gerar um ID público único para a foto de perfil
            public_id = f"alt_ilhabela/perfis/{user_id}_{uuid.uuid4()}"

            # Ler o conteúdo do ficheiro
            contents = await foto.read()

            # Fazer o upload para o Cloudinary
            upload_result = cloudinary.uploader.upload(
                contents,
                public_id=public_id,
                folder="alt_ilhabela/perfis",  # Organiza numa pasta
                overwrite=True,
                resource_type="image"  # Define como imagem
            )

            # Salvar a URL segura retornada pelo Cloudinary
            update_data["foto_url"] = upload_result.get("secure_url")

        except Exception as e:
            logging.error(
                f"Erro ao fazer upload da foto de perfil para o Cloudinary: {e}")
            raise HTTPException(
                status_code=500, detail=f"Erro ao salvar a foto: {e}")

    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})

    return {"message": "Perfil atualizado com sucesso"}


@api_router.put("/imoveis/{imovel_id}", response_model=Imovel)
async def update_imovel(
    imovel_id: str,
    imovel_data: ImovelUpdate,
    current_user: User = Depends(get_membro_user)
):
    existing_imovel = await db.imoveis.find_one({"id": imovel_id, "proprietario_id": current_user.id})
    if not existing_imovel:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    update_data = imovel_data.dict(exclude_none=True)
    url_fields = ["video_url", "link_booking", "link_airbnb"]
    for field in url_fields:
        if hasattr(imovel_data, field):
            field_value = getattr(imovel_data, field)
            update_data[field] = str(
                field_value) if field_value is not None else None
    update_data["updated_at"] = datetime.now(timezone.utc)
    await db.imoveis.update_one({"id": imovel_id}, {"$set": update_data})
    updated_imovel = await db.imoveis.find_one({"id": imovel_id})
    if updated_imovel:
        updated_imovel.pop("_id", None)
        return Imovel(**updated_imovel)
    raise HTTPException(
        status_code=404, detail="Imóvel não encontrado após a atualização")


@api_router.delete("/imoveis/{imovel_id}")
async def delete_imovel(imovel_id: str, current_user: User = Depends(get_membro_user)):
    result = await db.imoveis.update_one(
        {"id": imovel_id, "proprietario_id": current_user.id},
        {"$set": {"ativo": False, "updated_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    return {"message": "Imóvel removido com sucesso"}


@api_router.get("/parceiros", response_model=List[PerfilParceiro])
async def get_parceiros():
    parceiros_cursor = await db.perfis_parceiros.find({"ativo": True}).sort("created_at", -1).to_list(length=None)
    valid_parceiros = []
    for parceiro_data in parceiros_cursor:
        try:
            valid_parceiros.append(PerfilParceiro(**parceiro_data))
        except ValidationError as e:
            logging.warning(
                f"Skipping invalid partner data (ID: {parceiro_data.get('id')}): {e}")
    return valid_parceiros


@api_router.get("/admin/parceiros", response_model=List[PerfilParceiro])
async def get_admin_parceiros(current_user: User = Depends(get_admin_user)):
    parceiros_cursor = await db.perfis_parceiros.find({}).sort("created_at", -1).to_list(length=None)
    parceiros_validos = []
    for parceiro_data in parceiros_cursor:
        try:
            parceiros_validos.append(PerfilParceiro(**parceiro_data))
        except Exception as e:
            print(
                f"AVISO: Dados de parceiro inválidos (ID: {parceiro_data.get('id', 'N/A')}). Erro: {e}")
    return parceiros_validos


@api_router.get("/parceiros/{parceiro_id}", response_model=PerfilParceiro)
async def get_parceiro_detalhe(parceiro_id: str):
    perfil = await db.perfis_parceiros.find_one({"id": parceiro_id, "ativo": True})
    if not perfil:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    return PerfilParceiro(**perfil)


@api_router.get("/meu-perfil-parceiro", response_model=PerfilParceiro)
async def get_meu_perfil_parceiro(current_user: User = Depends(get_parceiro_user)):
    perfil_data = await db.perfis_parceiros.find_one({"user_id": current_user.id})
    if not perfil_data:
        raise HTTPException(
            status_code=404, detail="Perfil de parceiro não encontrado para este usuário.")
    try:
        return PerfilParceiro(**perfil_data)
    except ValidationError as e:
        print(
            f"ERRO CRÍTICO: Dados inválidos no perfil do parceiro user_id: {current_user.id}. Erro: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ocorreu um erro ao carregar o seu perfil. Os dados armazenados parecem estar corrompidos ou desatualizados."
        )


@api_router.post("/perfil-parceiro", response_model=PerfilParceiro)
async def create_perfil_parceiro(
    perfil_data: PerfilParceiroCreate,
    current_user: User = Depends(get_parceiro_user)
):
    existing = await db.perfis_parceiros.find_one({"user_id": current_user.id})
    if existing:
        raise HTTPException(status_code=400, detail="Perfil já existe")
    perfil = PerfilParceiro(user_id=current_user.id, **perfil_data.dict())
    perfil_dict = perfil.dict()
    await db.perfis_parceiros.insert_one(perfil_dict)
    return perfil


@api_router.put("/perfil-parceiro/{perfil_id}", response_model=PerfilParceiro)
async def update_perfil_parceiro(
    perfil_id: str,
    perfil_data: PerfilParceiroCreate,
    current_user: User = Depends(get_parceiro_user)
):
    try:
        update_data = perfil_data.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.now(timezone.utc)
        url_fields = ["website", "instagram", "facebook"]
        for field in url_fields:
            if field in update_data and (update_data[field] == '' or update_data[field] is None):
                update_data[field] = None
            elif field in update_data:
                update_data[field] = str(update_data[field])
        result = await db.perfis_parceiros.update_one(
            {"id": perfil_id, "user_id": current_user.id},
            {"$set": update_data}
        )
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404, detail="Perfil não encontrado ou não tem permissão para editar")
        updated_perfil = await db.perfis_parceiros.find_one({"id": perfil_id})
        if not updated_perfil:
            raise HTTPException(
                status_code=404, detail="Perfil não encontrado após atualização.")
        updated_perfil.pop("_id", None)
        return PerfilParceiro(**updated_perfil)
    except ValidationError as e:
        print(
            f"!!!!! Pydantic Validation Error in update_perfil_parceiro: {e.json()}")
        raise HTTPException(status_code=422, detail=e.errors())
    except Exception as e:
        print(f"!!!!! UNEXPECTED ERROR in update_perfil_parceiro: {e}")
        raise HTTPException(
            status_code=500, detail="Ocorreu um erro interno no servidor ao atualizar o perfil.")


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
async def get_noticia(noticia_id: str):
    noticia = await db.noticias.find_one({"id": noticia_id, "publicada": True})
    if not noticia:
        raise HTTPException(status_code=404, detail="Notícia não encontrada")
    return Noticia(**noticia)


@api_router.post("/admin/noticias", response_model=Noticia)
async def create_noticia(noticia_data: NoticiaCreate, current_user: User = Depends(get_admin_user)):
    noticia = Noticia(autor_id=current_user.id,
                      autor_nome=current_user.nome, **noticia_data.dict())
    noticia_dict = noticia.dict()
    for key, value in noticia_dict.items():
        if hasattr(value, 'scheme'):
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
    result = await db.noticias.update_one({"id": noticia_id}, {"$set": update_data})
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


@api_router.get("/admin/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_admin_user)):
    total_users = await db.users.count_documents({})
    total_membros = await db.users.count_documents({"role": "membro"})
    total_parceiros = await db.users.count_documents({"role": "parceiro"})
    total_associados = await db.users.count_documents({"role": "associado"})
    candidaturas_membros = await db.candidaturas_membros.count_documents(
        {"status": "pendente"})
    candidaturas_parceiros = await db.candidaturas_parceiros.count_documents(
        {"status": "pendente"})
    candidaturas_associados = await db.candidaturas_associados.count_documents(
        {"status": "pendente"})
    candidaturas_pendentes = candidaturas_membros + \
        candidaturas_parceiros + candidaturas_associados
    total_imoveis = await db.imoveis.count_documents({"ativo": True, "status_aprovacao": "aprovado"})
    total_noticias = await db.noticias.count_documents({"publicada": True})
    imoveis_destaque = await db.imoveis.count_documents(
        {"ativo": True, "destaque": True, "status_aprovacao": "aprovado"})
    parceiros_destaque = await db.perfis_parceiros.count_documents(
        {"ativo": True, "destaque": True})
    return DashboardStats(total_users=total_users, total_membros=total_membros, total_parceiros=total_parceiros, total_associados=total_associados,
                          candidaturas_pendentes=candidaturas_pendentes, total_imoveis=total_imoveis, total_noticias=total_noticias,
                          imoveis_destaque=imoveis_destaque, parceiros_destaque=parceiros_destaque)


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
    collection_map = {"membro": db.candidaturas_membros, "parceiro": db.candidaturas_parceiros,
                      "associado": db.candidaturas_associados}
    if tipo not in collection_map:
        raise HTTPException(
            status_code=400, detail="Tipo de candidatura inválido")
    collection = collection_map[tipo]
    candidatura = await collection.find_one({"id": candidatura_id})
    if not candidatura:
        raise HTTPException(
            status_code=404, detail="Candidatura não encontrada")
    temp_password = secrets.token_urlsafe(12)
    user_data = UserCreate(email=candidatura['email'], nome=candidatura['nome'],
                           telefone=candidatura['telefone'], role=tipo, password=temp_password)
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Usuário já existe")
    hashed_password = get_password_hash(temp_password)
    user_obj = User(email=user_data.email, nome=user_data.nome,
                    telefone=user_data.telefone, role=user_data.role)
    user_doc = user_obj.dict()
    user_doc['hashed_password'] = hashed_password
    await db.users.insert_one(user_doc)
    await collection.update_one({"id": candidatura_id}, {"$set": {"status": "aprovado"}})
    subject = "Bem-vindo à ALT Ilhabela!"
    body_plain = f"""Olá {candidatura['nome']}, etc..."""
    body_html_content = f"""<p>Sua candidatura foi <strong>aprovada</strong>!</p>"""
    html_email = create_praia_email_html(
        titulo="Bem-vindo(a)!",
        pre_cabecalho="Sua candidatura foi aprovada.",
        nome_usuario=candidatura['nome'],
        corpo_mensagem=body_html_content,
        texto_botao="Acessar o Portal",
        url_botao="https://temp-housing.preview.emergentagent.com/login"
    )
    background_tasks.add_task(
        send_email, candidatura['email'], subject, body_plain, html_email)
    return {"message": "Candidatura aprovada com sucesso"}


@api_router.post("/admin/candidaturas/{tipo}/{candidatura_id}/recusar")
async def recusar_candidatura(
    tipo: str,
    candidatura_id: str,
    background_tasks: BackgroundTasks,
    motivo: str = Body(..., embed=True),
    current_user: User = Depends(get_admin_user)
):
    collection_map = {"membro": db.candidaturas_membros, "parceiro": db.candidaturas_parceiros,
                      "associado": db.candidaturas_associados}
    if tipo not in collection_map:
        raise HTTPException(
            status_code=400, detail="Tipo de candidatura inválido")
    collection = collection_map[tipo]
    candidatura = await collection.find_one({"id": candidatura_id})
    if not candidatura:
        raise HTTPException(
            status_code=404, detail="Candidatura não encontrada")
    await collection.update_one({"id": candidatura_id}, {
                                "$set": {"status": "recusado", "motivo_recusa": motivo}})
    subject = "Atualização sobre sua candidatura - ALT Ilhabela"
    body = f"""Olá {candidatura['nome']}, etc..."""
    background_tasks.add_task(send_email, candidatura['email'], subject, body)
    return {"message": "Candidatura recusada"}


@api_router.post("/admin/email-massa")
async def enviar_email_massa(
    email_data: EmailMassa,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_admin_user)
):
    user_emails = []
    for role in email_data.destinatarios:
        if role == "todos":
            users = await db.users.find({"ativo": True}).to_list(length=None)
        else:
            users = await db.users.find({"role": role, "ativo": True}).to_list(length=None)
        for user in users:
            if user['email'] not in user_emails:
                user_emails.append(user['email'])
    for email in user_emails:
        background_tasks.add_task(
            send_email, email, email_data.assunto, email_data.mensagem)
    return {"message": f"Email enviado para {len(user_emails)} usuários", "destinatarios": len(user_emails)}


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
    user_to_update = await db.users.find_one({"id": user_id})
    if not user_to_update:
        raise HTTPException(
            status_code=404, detail="Utilizador não encontrado")
    if user_updates.get("ativo") is False:
        if user_to_update.get("role") == "membro":
            await db.imoveis.update_many({"proprietario_id": user_id}, {"$set": {"ativo": False}})
        elif user_to_update.get("role") == "parceiro":
            await db.perfis_parceiros.update_many({"user_id": user_id}, {"$set": {"ativo": False}})
    result = await db.users.update_one({"id": user_id}, {"$set": user_updates})
    if result.matched_count == 0:
        raise HTTPException(
            status_code=404, detail="Utilizador não encontrado durante a atualização")
    return {"message": "Utilizador atualizado com sucesso"}


@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_admin_user)):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400, detail="Você não pode apagar a sua própria conta")
    user_to_delete = await db.users.find_one({"id": user_id})
    if not user_to_delete:
        raise HTTPException(
            status_code=404, detail="Utilizador não encontrado")
    user_role = user_to_delete.get("role")
    if user_role == "membro":
        await db.imoveis.update_many({"proprietario_id": user_id}, {"$set": {"ativo": False}})
    elif user_role == "parceiro":
        await db.perfis_parceiros.update_many({"user_id": user_id}, {"$set": {"ativo": False}})
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404, detail="Utilizador não encontrado durante a exclusão")
    return {"message": f"Utilizador {user_to_delete.get('nome', 'desconhecido')} foi removido e seus dados associados foram desativados."}


@api_router.get("/admin/imoveis", response_model=List[Imovel])
async def get_admin_imoveis(current_user: User = Depends(get_admin_user)):
    imoveis = await db.imoveis.find({}).sort("created_at", -1).to_list(length=None)
    valid_imoveis = []
    for imovel_data in imoveis:
        imovel_data.pop("_id", None)
        try:
            valid_imoveis.append(Imovel(**imovel_data))
        except Exception as e:
            print(
                f"Skipping invalid property data (ID: {imovel_data.get('id')}): {e}")
    return valid_imoveis


@api_router.post("/admin/imoveis/{imovel_id}/aprovar")
async def aprovar_imovel(imovel_id: str, current_user: User = Depends(get_admin_user)):
    result = await db.imoveis.update_one(
        {"id": imovel_id},
        {"$set": {"status_aprovacao": "aprovado",
                  "updated_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    imovel = await db.imoveis.find_one({"id": imovel_id})
    owner = await db.users.find_one({"id": imovel["proprietario_id"]})
    if owner and owner.get("email"):
        try:
            subject = "Seu Imóvel foi Aprovado!"
            body_plain = f"""Olá {owner.get('nome', 'Proprietário')}, etc..."""
            body_html_content = f"""<p>Ótimas notícias! Seu imóvel "<strong>{imovel['titulo']}</strong>" foi aprovado.</p>"""
            html_email = create_praia_email_html(
                titulo="Imóvel Aprovado!",
                pre_cabecalho=f"Boas notícias sobre o seu imóvel {imovel['titulo']}",
                nome_usuario=owner.get('nome', 'Proprietário'),
                corpo_mensagem=body_html_content,
                texto_botao="Gerenciar Meus Imóveis",
                url_botao="https://temporada-portal.preview.emergentagent.com/meus-imoveis"
            )
            await send_email(to_email=owner["email"], subject=subject,
                             body=body_plain, html_body=html_email)
        except Exception as e:
            print(f"Erro ao enviar email de aprovação de imóvel: {e}")
    return {"message": "Imóvel aprovado com sucesso"}


@api_router.post("/admin/imoveis/{imovel_id}/recusar")
async def recusar_imovel(
    imovel_id: str,
    motivo: str = Body(..., embed=True),
    current_user: User = Depends(get_admin_user)
):
    result = await db.imoveis.update_one(
        {"id": imovel_id},
        {"$set": {"status_aprovacao": "recusado",
                  "updated_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    imovel = await db.imoveis.find_one({"id": imovel_id})
    owner = await db.users.find_one({"id": imovel["proprietario_id"]})
    if owner and owner.get("email"):
        try:
            subject = "Atualização sobre seu Imóvel - ALT Ilhabela"
            body_plain = f"""Olá {owner.get('nome', 'Proprietário')}, etc..."""
            html_motivo = f"<p><strong>Motivo:</strong> {motivo}</p>" if motivo else "<p>Por favor, revise os dados.</p>"
            body_html_content = f"""<p>Seu imóvel "<strong>{imovel['titulo']}</strong>" precisa de ajustes.</p>{html_motivo}"""
            html_email = create_praia_email_html(
                titulo="Atualização sobre seu Imóvel",
                pre_cabecalho="Informações sobre a publicação do seu imóvel.",
                nome_usuario=owner.get('nome', 'Proprietário'),
                corpo_mensagem=body_html_content,
                texto_botao="Acessar Meus Imóveis",
                url_botao="https://temporada-portal.preview.emergentagent.com/meus-imoveis"
            )
            await send_email(to_email=owner["email"], subject=subject,
                             body=body_plain, html_body=html_email)
        except Exception as e:
            print(f"Erro ao enviar email de recusa de imóvel: {e}")
    return {"message": "Imóvel recusado com sucesso"}


# --- ROTA DE UPLOAD DE FOTO MODIFICADA ---
@api_router.post("/upload/foto")
async def upload_foto(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Arquivo inválido")

    # Gerar um ID público único para o Cloudinary
    file_id = str(uuid.uuid4())

    try:
        # Ler o conteúdo do ficheiro
        contents = await file.read()

        # Fazer o upload para o Cloudinary
        upload_result = cloudinary.uploader.upload(
            contents,
            public_id=file_id,
            folder="alt_ilhabela/fotos",  # Organiza numa pasta
            resource_type="image"  # Garante que é tratado como imagem
        )

        # O "filename" que o frontend espera é o ID + extensão
        # O Cloudinary pode converter o formato, por isso usamos o formato retornado
        file_format = upload_result.get("format", "jpg")
        filename = f"{file_id}.{file_format}"

        # Retornamos a URL segura do Cloudinary e o "filename"
        return {"url": upload_result.get("secure_url"), "filename": filename}

    except Exception as e:
        logging.error(f"Erro ao fazer upload da foto para o Cloudinary: {e}")
        raise HTTPException(status_code=500, detail="Erro ao salvar arquivo")


# --- ROTA DE APAGAR FOTO MODIFICADA ---
@api_router.delete("/upload/foto/{filename}")
async def delete_foto(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    try:
        # O "public_id" é o nome do ficheiro sem a extensão
        # E precisamos de incluir a pasta
        public_id = f"alt_ilhabela/fotos/{Path(filename).stem}"

        # Apagar do Cloudinary
        result = cloudinary.uploader.destroy(
            public_id,
            resource_type="image"  # Especifica que é uma imagem
        )

        # Se não for encontrado, tenta apagar como vídeo (para o /upload/video)
        if result.get("result") == "not found":
            public_id_video = f"alt_ilhabela/videos/{Path(filename).stem}"
            result_video = cloudinary.uploader.destroy(
                public_id_video,
                resource_type="video"  # Especifica que é um vídeo
            )
            if result_video.get("result") == "not found":
                logging.warning(
                    f"Ficheiro {filename} (public_id: {public_id}) não encontrado no Cloudinary para apagar.")

        return {"message": "Foto removida com sucesso"}

    except Exception as e:
        logging.error(f"Erro ao remover foto do Cloudinary: {e}")
        raise HTTPException(status_code=500, detail="Erro ao remover foto")


# --- ROTA DE UPLOAD DE VÍDEO MODIFICADA ---
@api_router.post("/upload/video")
async def upload_video(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Ficheiro inválido")

    # Gerar um ID público único
    file_id = str(uuid.uuid4())

    try:
        # Ler o conteúdo
        contents = await file.read()

        # Fazer o upload para o Cloudinary como vídeo
        upload_result = cloudinary.uploader.upload(
            contents,
            public_id=file_id,
            folder="alt_ilhabela/videos",
            resource_type="video"  # MUITO IMPORTANTE: define como vídeo
        )

        # Construir o filename
        file_format = upload_result.get("format", "mp4")
        filename = f"{file_id}.{file_format}"

        return {"url": upload_result.get("secure_url"), "filename": filename}

    except Exception as e:
        logging.error(f"Erro ao fazer upload do vídeo para o Cloudinary: {e}")
        raise HTTPException(
            status_code=500, detail="Erro ao salvar o ficheiro")


@api_router.put("/admin/imoveis/{imovel_id}/destaque")
async def toggle_imovel_destaque(
    imovel_id: str,
    destaque: bool,
    current_user: User = Depends(get_admin_user)
):
    result = await db.imoveis.update_one(
        {"id": imovel_id},
        {"$set": {"destaque": destaque,
                  "updated_at": datetime.now(timezone.utc)}}
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
        {"$set": {"destaque": destaque,
                  "updated_at": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado")
    return {"message": f"Parceiro {'adicionado ao' if destaque else 'removido do'} destaque"}


# ==============================================================================
# App Finalization (Middleware, Router, etc.)
# ==============================================================================

origins_from_env = os.environ.get(
    'CORS_ORIGINS', 'http://localhost:3000').split(',')
allowed_origins = list(
    set(origins_from_env + ["http://localhost:3000", "http://127.0.0.1:3000"]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REMOVIDO ---
# A pasta /uploads não é mais servida estaticamente
# app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(api_router)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
