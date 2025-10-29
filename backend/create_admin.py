import os
import asyncio
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from pathlib import Path

# --- Definições copiadas do server.py para garantir compatibilidade ---

# Carregar variáveis de ambiente
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configuração de Senha (idêntica ao server.py)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password):
    return pwd_context.hash(password)

# Definição de Roles (idêntica ao server.py)


class UserRole:
    ADMIN = "admin"
    ASSOCIADO = "associado"
    MEMBRO = "membro"
    PARCEIRO = "parceiro"

# Modelo Pydantic do Utilizador (idêntico ao server.py)


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

# --- Função Principal do Script ---


async def create_admin():
    print("--- Script de Criação de Admin para ALT Ilhabela ---")

    # 1. Ler as variáveis de ambiente
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'alt_ilhabela')

    if not mongo_url:
        print("\nERRO: A variável de ambiente 'MONGO_URL' não foi encontrada.")
        print("Certifica-te que tens um ficheiro '.env' nesta pasta com a tua string de conexão do MongoDB Atlas.")
        return

    # 2. Ligar ao MongoDB Atlas
    print(f"A ligar à base de dados '{db_name}'...")
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        # Tenta pingar a base de dados para confirmar a ligação
        await client.admin.command('ping')
        print("Ligação à base de dados estabelecida com sucesso!")
    except Exception as e:
        print(f"\nERRO: Não foi possível ligar ao MongoDB Atlas.")
        print(f"Detalhe: {e}")
        print(
            "Verifica se a tua string de conexão 'MONGO_URL' está correta no ficheiro .env")
        print("E verifica se o teu IP atual está na 'IP Access List' do MongoDB Atlas.")
        return

    # 3. Pedir os dados do Admin
    print("\n--- Por favor, insere os dados do novo Admin ---")
    email = input("Email do Admin: ").strip()
    nome = input("Nome do Admin: ").strip()
    password = input("Senha do Admin (mín. 6 caracteres): ").strip()

    if not email or not nome or not password or len(password) < 6:
        print("\nERRO: Todos os campos são obrigatórios e a senha deve ter pelo menos 6 caracteres.")
        client.close()
        return

    # 4. Verificar se o utilizador já existe
    users_collection = db.users
    existing_user = await users_collection.find_one({"email": email})

    if existing_user:
        print(f"\nERRO: Já existe um utilizador com o email '{email}'.")
        client.close()
        return

    # 5. Criar o novo utilizador
    try:
        print("\nA encriptar a senha...")
        hashed_password = get_password_hash(password)

        admin_user = User(
            email=email,
            nome=nome,
            role=UserRole.ADMIN,
            ativo=True
        )

        user_doc = admin_user.dict()
        user_doc['hashed_password'] = hashed_password

        print(f"A inserir o utilizador '{nome}' ({email}) na base de dados...")
        result = await users_collection.insert_one(user_doc)

        if result.inserted_id:
            print("\nSUCESSO!")
            print(f"Utilizador Admin '{nome}' criado com sucesso.")
            print("Podes agora fazer login no teu site.")
        else:
            print("\nERRO: Falha ao inserir o utilizador na base de dados.")

    except Exception as e:
        print(f"\nERRO Inesperado: {e}")
    finally:
        client.close()
        print("Ligação à base de dados fechada.")


if __name__ == "__main__":
    # O asyncio.run() é a forma moderna de executar uma função async
    asyncio.run(create_admin())
