import os
import asyncio
import uuid
import certifi
from pathlib import Path
from datetime import datetime, timezone
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, Field, EmailStr
from typing import Optional

# --- Configurações ---
print("--- Gerador de Utilizadores (Membro/Parceiro) ---")

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password):
    return pwd_context.hash(password)

# --- Função Principal ---


async def create_user():
    # 1. Conectar ao Banco
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'alt_ilhabela')

    if not mongo_url:
        print("ERRO: Variável MONGO_URL não encontrada no .env")
        return

    print(f"Conectando ao MongoDB Atlas...")

    try:
        client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
        db = client[db_name]
        await client.admin.command('ping')
        print("✅ Conectado com sucesso!")
    except Exception as e:
        print(f"\n❌ Erro de conexão: {e}")
        return

    # 2. Menu de Escolha
    print("\nO que você deseja criar?")
    print("1 - Membro (Anfitrião de Imóveis)")
    print("2 - Parceiro (Dono de Comércio/Serviço)")
    opcao = input("Escolha (1 ou 2): ").strip()

    role = ""
    role_name = ""

    if opcao == "1":
        role = "membro"
        role_name = "Membro"
    elif opcao == "2":
        role = "parceiro"
        role_name = "Parceiro"
    else:
        print("Opção inválida.")
        client.close()
        return

    # 3. Dados do Usuário
    print(f"\n--- Criando Novo {role_name} ---")
    nome = input("Nome Completo: ").strip()
    email = input("Email de Login: ").strip()
    password = input("Senha (mín. 6 dígitos): ").strip()

    if len(password) < 6:
        print("❌ A senha precisa ter pelo menos 6 caracteres.")
        client.close()
        return

    # 4. Verificar duplicidade
    users_collection = db.users
    if await users_collection.find_one({"email": email}):
        print(f"❌ Erro: O email '{email}' já está cadastrado.")
        client.close()
        return

    # 5. Inserir no Banco
    try:
        hashed_password = get_password_hash(password)

        new_user = {
            "id": str(uuid.uuid4()),
            "email": email,
            "nome": nome,
            "role": role,
            "ativo": True,
            "created_at": datetime.now(timezone.utc),
            "hashed_password": hashed_password
        }

        await users_collection.insert_one(new_user)

        print(f"\n🎉 SUCESSO!")
        print(f"Usuário: {email}")
        print(f"Senha: {password}")
        print(f"Tipo: {role_name}")
        print("\nPode fazer login direto no site (sem precisar de aprovação).")

        if role == "parceiro":
            print(
                "⚠️ Nota: Como Parceiro, ao entrar, vá em 'Meu Perfil' para criar a página da sua empresa.")
        elif role == "membro":
            print(
                "⚠️ Nota: Como Membro, ao entrar, vá em 'Meus Imóveis' para cadastrar casas.")

    except Exception as e:
        print(f"Erro ao salvar: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_user())
