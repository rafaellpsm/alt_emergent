#!/usr/bin/env python3
"""
Create test data for Portal ALT Ilhabela
"""
import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import uuid
from datetime import datetime, timezone

# Load environment variables
load_dotenv('/app/backend/.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def create_test_member():
    """Create a test member user"""

    # Check if test member already exists
    existing_member = await db.users.find_one({"email": "membro@alt-ilhabela.com"})
    if existing_member:
        print("Test member already exists!")
        return existing_member['id']

    # Member user data
    member_data = {
        "id": str(uuid.uuid4()),
        "email": "membro@alt-ilhabela.com",
        "nome": "João Silva",
        "telefone": "+55 12 98765-4321",
        "role": "membro",
        "ativo": True,
        "created_at": datetime.now(timezone.utc),
        "hashed_password": pwd_context.hash("membro123")
    }

    # Insert member user
    await db.users.insert_one(member_data)

    print("Test member created successfully!")
    print(f"Email: {member_data['email']}")
    print(f"Password: membro123")

    return member_data['id']


async def create_test_properties(member_id):
    """Create test properties for the member"""

    # Check if properties already exist
    existing_props = await db.imoveis.count_documents({"proprietario_id": member_id})
    if existing_props > 0:
        print(f"Test properties already exist ({existing_props} properties)")
        return

    # Sample properties
    properties = [
        {
            "id": str(uuid.uuid4()),
            "titulo": "Casa de Praia em Ilhabela",
            "descricao": "Linda casa com vista para o mar, ideal para famílias",
            "tipo": "Casa",
            "regiao": "Centro",
            "endereco_completo": "Rua das Flores, 123 - Centro, Ilhabela/SP",
            "num_quartos": 3,
            "num_banheiros": 2,
            "capacidade": 6,
            "possui_piscina": True,
            "possui_churrasqueira": True,
            "possui_wifi": True,
            "permite_pets": False,
            "tem_vista_mar": True,
            "tem_ar_condicionado": True,
            "fotos": [],
            "ativo": True,
            "destaque": True,
            "proprietario_id": member_id,
            "visualizacoes": 0,
            "cliques_link": 0,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "titulo": "Apartamento Moderno",
            "descricao": "Apartamento moderno no centro de Ilhabela",
            "tipo": "Apartamento",
            "regiao": "Centro",
            "endereco_completo": "Av. Brasil, 456 - Centro, Ilhabela/SP",
            "num_quartos": 2,
            "num_banheiros": 1,
            "capacidade": 4,
            "possui_piscina": False,
            "possui_churrasqueira": False,
            "possui_wifi": True,
            "permite_pets": True,
            "tem_vista_mar": False,
            "tem_ar_condicionado": True,
            "fotos": [],
            "ativo": True,
            "destaque": False,
            "proprietario_id": member_id,
            "visualizacoes": 0,
            "cliques_link": 0,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    ]

    # Insert properties
    await db.imoveis.insert_many(properties)

    print(f"Created {len(properties)} test properties")


async def create_test_partner():
    """Create a test partner user and profile"""

    # Check if test partner already exists
    existing_partner = await db.users.find_one({"email": "parceiro@alt-ilhabela.com"})
    if existing_partner:
        print("Test partner already exists!")
        partner_id = existing_partner['id']
    else:
        # Partner user data
        partner_data = {
            "id": str(uuid.uuid4()),
            "email": "parceiro@alt-ilhabela.com",
            "nome": "Maria Santos",
            "telefone": "+55 12 99876-5432",
            "role": "parceiro",
            "ativo": True,
            "created_at": datetime.now(timezone.utc),
            "hashed_password": pwd_context.hash("parceiro123")
        }

        # Insert partner user
        await db.users.insert_one(partner_data)
        partner_id = partner_data['id']

        print("Test partner created successfully!")
        print(f"Email: {partner_data['email']}")
        print(f"Password: parceiro123")

    # Check if partner profile exists
    existing_profile = await db.perfis_parceiros.find_one({"user_id": partner_id})
    if existing_profile:
        print("Partner profile already exists!")
        return

    # Partner profile data
    profile_data = {
        "id": str(uuid.uuid4()),
        "user_id": partner_id,
        "nome_empresa": "Restaurante Maré Alta",
        "descricao": "Restaurante especializado em frutos do mar com vista para o mar",
        "categoria": "Restaurante",
        "telefone": "+55 12 99876-5432",
        "endereco": "Av. Beira Mar, 789 - Praia do Perequê, Ilhabela/SP",
        "website": "https://marealta.com.br",
        "instagram": "https://instagram.com/marealta",
        "fotos": [],
        "horario_funcionamento": "12:00 às 22:00",
        "servicos": ["Almoço", "Jantar", "Frutos do Mar", "Vista para o Mar"],
        "aceita_cartao": True,
        "delivery": False,
        "destaque": True,
        "ativo": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    # Insert partner profile
    await db.perfis_parceiros.insert_one(profile_data)

    print("Created test partner profile")


async def main():
    try:
        print("Creating test data for Portal ALT Ilhabela...")

        # Create test member and properties
        member_id = await create_test_member()
        await create_test_properties(member_id)

        # Create test partner
        await create_test_partner()

        print("\n✅ Test data creation completed!")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
