#!/usr/bin/env python3
"""
Script para criar usuário administrador inicial
"""
import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import uuid
from datetime import datetime, timezone

# Load environment variables
load_dotenv('.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin_user():
    """Create initial admin user"""
    
    # Check if admin already exists
    existing_admin = await db.users.find_one({"role": "admin"})
    if existing_admin:
        print("Usuário administrador já existe!")
        print(f"Email: {existing_admin['email']}")
        return
    
    # Admin user data
    admin_data = {
        "id": str(uuid.uuid4()),
        "email": "admin@alt-ilhabela.com",
        "nome": "Administrador ALT",
        "telefone": "+55 12 99999-9999",
        "role": "admin",
        "ativo": True,
        "created_at": datetime.now(timezone.utc),
        "hashed_password": pwd_context.hash("admin123")
    }
    
    # Insert admin user
    await db.users.insert_one(admin_data)
    
    print("Usuário administrador criado com sucesso!")
    print(f"Email: {admin_data['email']}")
    print(f"Senha: admin123")
    print("\nIMPORTANTE: Altere a senha após o primeiro login!")

async def main():
    try:
        await create_admin_user()
    except Exception as e:
        print(f"Erro: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())