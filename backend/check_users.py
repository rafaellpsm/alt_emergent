#!/usr/bin/env python3
"""
Script para verificar usuários no banco
"""
import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load environment variables
load_dotenv('.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def check_users():
    """Check users in database"""
    
    users = await db.users.find({}).to_list(length=None)
    
    print("=== USUÁRIOS NO BANCO ===")
    for user in users:
        print(f"Email: {user['email']}")
        print(f"Nome: {user['nome']}")
        print(f"Role: {user['role']}")
        print(f"Ativo: {user['ativo']}")
        print("---")
    
    print("\n=== CANDIDATURAS MEMBROS ===")
    candidaturas = await db.candidaturas_membros.find({}).to_list(length=None)
    for c in candidaturas:
        print(f"Nome: {c['nome']}")
        print(f"Email: {c['email']}")
        print(f"Status: {c['status']}")
        print("---")
    
    print("\n=== CANDIDATURAS PARCEIROS ===")
    candidaturas_p = await db.candidaturas_parceiros.find({}).to_list(length=None)
    for c in candidaturas_p:
        print(f"Nome: {c['nome']}")
        print(f"Email: {c['email']}")
        print(f"Empresa: {c['nome_empresa']}")
        print(f"Status: {c['status']}")
        print("---")
    
    print("\n=== CANDIDATURAS ASSOCIADOS ===")
    candidaturas_a = await db.candidaturas_associados.find({}).to_list(length=None)
    for c in candidaturas_a:
        print(f"Nome: {c['nome']}")
        print(f"Email: {c['email']}")
        print(f"Status: {c['status']}")
        print("---")

async def main():
    try:
        await check_users()
    except Exception as e:
        print(f"Erro: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())