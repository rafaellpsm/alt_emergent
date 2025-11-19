import os
import asyncio
import uuid
import certifi  # <--- Importante para corrigir o erro SSL
from pathlib import Path
from datetime import datetime, timezone
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, Field, EmailStr
from typing import Optional

# --- 1. Configurações Iniciais ---
print("--- Iniciando Script de Admin ---")

# Carregar variáveis de ambiente
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configuração de Senha
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password):
    return pwd_context.hash(password)

# --- 2. Definição dos Modelos (Copiados para garantir independência) ---


class UserRole:
    ADMIN = "admin"


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    nome: str
    telefone: Optional[str] = None
    role: str
    ativo: bool = True
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc))

# --- 3. Função Principal ---


async def create_admin():
    # Ler variáveis
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'alt_ilhabela')

    if not mongo_url:
        print("ERRO: MONGO_URL não encontrada no ficheiro .env")
        return

    print(f"Tentando conectar ao MongoDB Atlas...")

    try:
        # --- AQUI ESTÁ A CORREÇÃO DO SSL ---
        # tlsCAFile=certifi.where() diz ao Python onde estão os certificados seguros
        client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
        db = client[db_name]

        # Teste de conexão (Ping)
        await client.admin.command('ping')
        print("✅ Conexão estabelecida com sucesso!")

    except Exception as e:
        print(f"\n❌ ERRO DE CONEXÃO: {e}")
        print("DICA: Verifique se o seu IP atual foi adicionado no 'Network Access' do MongoDB Atlas.")
        return

    # Recolha de dados
    print("\n--- Dados do Novo Admin ---")
    email = input("Email: ").strip()
    nome = input("Nome: ").strip()
    password = input("Senha (min 6 chars): ").strip()

    if len(password) < 6:
        print("❌ A senha deve ter pelo menos 6 caracteres.")
        return

    # Verificar duplicados
    users_collection = db.users
    existing = await users_collection.find_one({"email": email})
    if existing:
        print(f"❌ Já existe um usuário com o email {email}")
        return

    # Criar usuário
    try:
        hashed_password = get_password_hash(password)

        new_user = User(
            email=email,
            nome=nome,
            role=UserRole.ADMIN,
            ativo=True
        )

        user_doc = new_user.dict()
        user_doc['hashed_password'] = hashed_password

        await users_collection.insert_one(user_doc)
        print(f"\n🎉 SUCESSO! Admin '{nome}' criado.")
        print("Agora você pode fazer login no site.")

    except Exception as e:
        print(f"Erro ao salvar: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    # Executa o loop assíncrono
    try:
        asyncio.run(create_admin())
    except KeyboardInterrupt:
        print("\nOperação cancelada.")
