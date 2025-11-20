#!/usr/bin/env python3
"""
Create complete user ecosystem for Portal ALT Ilhabela
Creates users for all roles with sample data
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


async def ensure_admin_user():
    """Ensure admin user exists"""
    existing_admin = await db.users.find_one({"email": "admin@alt-ilhabela.com"})
    if existing_admin:
        print("✅ Admin user already exists")
        return existing_admin['id']

    admin_data = {
        "id": str(uuid.uuid4()),
        "email": "admin@alt-ilhabela.com",
        "nome": "Administrador ALT",
        "telefone": "+55 12 99999-0000",
        "role": "admin",
        "ativo": True,
        "created_at": datetime.now(timezone.utc),
        "hashed_password": pwd_context.hash("admin123")
    }

    await db.users.insert_one(admin_data)
    print("🔧 Admin user created")
    return admin_data['id']


async def create_membro_user():
    """Create member user with properties"""
    existing_member = await db.users.find_one({"email": "membro@alt-ilhabela.com"})
    if existing_member:
        print("✅ Membro user already exists")
        return existing_member['id']

    member_data = {
        "id": str(uuid.uuid4()),
        "email": "membro@alt-ilhabela.com",
        "nome": "João da Silva Proprietário",
        "telefone": "+55 12 98765-4321",
        "endereco": "Rua das Palmeiras, 123 - Centro, Ilhabela/SP",
        "role": "membro",
        "ativo": True,
        "created_at": datetime.now(timezone.utc),
        "hashed_password": pwd_context.hash("membro123")
    }

    await db.users.insert_one(member_data)
    print("🏠 Membro user created")

    # Create properties for member
    await create_member_properties(member_data['id'])
    return member_data['id']


async def create_member_properties(member_id):
    """Create sample properties for member"""
    # Check if properties exist
    existing_props = await db.imoveis.count_documents({"proprietario_id": member_id})
    if existing_props > 0:
        print("✅ Member properties already exist")
        return

    properties = [
        {
            "id": str(uuid.uuid4()),
            "titulo": "Casa Luxuosa Vista Mar - Curral",
            "descricao": "Casa de alto padrão com vista panorâmica para o mar, piscina infinita, churrasqueira gourmet e acabamentos de primeira linha. Ideal para famílias que buscam conforto e exclusividade.",
            "tipo": "casa",
            "regiao": "curral",
            "endereco_completo": "Rua dos Corais, 45 - Praia do Curral, Ilhabela/SP - CEP: 11630-000",
            "num_quartos": 4,
            "num_banheiros": 3,
            "capacidade": 8,
            "possui_piscina": True,
            "possui_churrasqueira": True,
            "possui_wifi": True,
            "permite_pets": False,
            "tem_vista_mar": True,
            "tem_ar_condicionado": True,
            "video_url": "https://youtube.com/watch?v=example1",
            "link_booking": "https://booking.com/hotel/br/casa-curral-ilhabela.html",
            "link_airbnb": "https://airbnb.com/rooms/12345678",
            "fotos": [
                "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
                "https://images.unsplash.com/photo-1505142468610-359e7d316be0"
            ],
            "ativo": True,
            "destaque": True,
            "proprietario_id": member_id,
            "visualizacoes": 127,
            "cliques_link": 23,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "titulo": "Apartamento Moderno Centro",
            "descricao": "Apartamento recém-reformado no coração de Ilhabela, próximo a restaurantes, comércio e balsa. Perfeito para casais ou pequenas famílias.",
            "tipo": "apartamento",
            "regiao": "centro",
            "endereco_completo": "Av. Princesa Isabel, 234 - Centro, Ilhabela/SP - CEP: 11630-000",
            "num_quartos": 2,
            "num_banheiros": 1,
            "capacidade": 4,
            "possui_piscina": False,
            "possui_churrasqueira": False,
            "possui_wifi": True,
            "permite_pets": True,
            "tem_vista_mar": False,
            "tem_ar_condicionado": True,
            "video_url": "",
            "link_booking": "",
            "link_airbnb": "https://airbnb.com/rooms/87654321",
            "fotos": [
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"
            ],
            "ativo": True,
            "destaque": False,
            "proprietario_id": member_id,
            "visualizacoes": 89,
            "cliques_link": 15,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "titulo": "Chalé Rústico na Vila",
            "descricao": "Chalé charmoso e aconchegante na Vila, ambiente rústico com muito verde. Perfeito para quem busca tranquilidade e contato com a natureza.",
            "tipo": "chale",
            "regiao": "vila",
            "endereco_completo": "Rua do Bosque, 78 - Vila, Ilhabela/SP - CEP: 11630-000",
            "num_quartos": 3,
            "num_banheiros": 2,
            "capacidade": 6,
            "possui_piscina": False,
            "possui_churrasqueira": True,
            "possui_wifi": True,
            "permite_pets": True,
            "tem_vista_mar": False,
            "tem_ar_condicionado": False,
            "video_url": "",
            "link_booking": "https://booking.com/hotel/br/chale-vila-ilhabela.html",
            "link_airbnb": "",
            "fotos": [
                "https://images.unsplash.com/photo-1449824913935-59a10b8d2000"
            ],
            "ativo": True,
            "destaque": False,
            "proprietario_id": member_id,
            "visualizacoes": 54,
            "cliques_link": 8,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    ]

    await db.imoveis.insert_many(properties)
    print(f"🏡 Created {len(properties)} properties for member")


async def create_parceiro_user():
    """Create partner user with business profile"""
    existing_partner = await db.users.find_one({"email": "parceiro@alt-ilhabela.com"})
    if existing_partner:
        print("✅ Parceiro user already exists")
        partner_id = existing_partner['id']
    else:
        partner_data = {
            "id": str(uuid.uuid4()),
            "email": "parceiro@alt-ilhabela.com",
            "nome": "Maria Santos Empresária",
            "telefone": "+55 12 99876-5432",
            "role": "parceiro",
            "ativo": True,
            "created_at": datetime.now(timezone.utc),
            "hashed_password": pwd_context.hash("parceiro123")
        }

        await db.users.insert_one(partner_data)
        partner_id = partner_data['id']
        print("🏢 Parceiro user created")

    # Create partner profiles
    await create_partner_profiles(partner_id)
    return partner_id


async def create_partner_profiles(partner_id):
    """Create multiple partner business profiles"""
    existing_profile = await db.perfis_parceiros.find_one({"user_id": partner_id})
    if existing_profile:
        print("✅ Partner profiles already exist")
        return

    profiles = [
        {
            "id": str(uuid.uuid4()),
            "user_id": partner_id,
            "nome_empresa": "Restaurante Vista do Mar",
            "nome_responsavel": "Maria Santos",
            "email": "contato@restaurantevistamar.com.br",
            "telefone": "+55 12 99876-5432",
            "cnpj": "12.345.678/0001-90",
            "endereco": "Av. Beira Mar, 150 - Perequê, Ilhabela/SP",
            "categoria": "Gastronomia",
            "subcategoria": "Restaurante",
            "descricao": "Restaurante especializado em frutos do mar e culinária caiçara com vista privilegiada para o canal de São Sebastião. Ambiente aconchegante para almoços e jantares românticos.",
            "servicos_oferecidos": "Pratos à la carte, Menu degustação, Eventos privados, Delivery",
            "tempo_operacao": "8 anos",
            "website": "https://restaurantevistamar.com.br",
            "instagram": "https://instagram.com/vistadomarilhabela",
            "facebook": "https://facebook.com/restaurantevistamar",
            "whatsapp": "+55 12 99876-5432",
            "horario_funcionamento": "Terça a Domingo: 12h às 22h",
            "aceita_cartao": True,
            "aceita_pix": True,
            "tem_estacionamento": True,
            "tem_wifi": True,
            "acessivel_cadeirante": True,
            "fotos": [
                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
                "https://images.unsplash.com/photo-1559339352-11d035aa65de"
            ],
            "ativo": True,
            "destaque": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    ]

    await db.perfis_parceiros.insert_many(profiles)
    print(f"🍽️ Created {len(profiles)} partner profiles")


async def create_associado_user():
    """Create associado user"""
    existing_associado = await db.users.find_one({"email": "associado@alt-ilhabela.com"})
    if existing_associado:
        print("✅ Associado user already exists")
        return existing_associado['id']

    associado_data = {
        "id": str(uuid.uuid4()),
        "email": "associado@alt-ilhabela.com",
        "nome": "Carlos Eduardo Apoiador",
        "telefone": "+55 12 97777-8888",
        "endereco": "Rua das Acácias, 456 - São Paulo/SP",
        "ocupacao": "Engenheiro Civil",
        "empresa_trabalho": "Construtora São Paulo Ltda",
        "linkedin": "https://linkedin.com/in/carlos-eduardo-apoiador",
        "role": "associado",
        "ativo": True,
        "created_at": datetime.now(timezone.utc),
        "hashed_password": pwd_context.hash("associado123")
    }

    await db.users.insert_one(associado_data)
    print("🤝 Associado user created")
    return associado_data['id']


async def create_sample_news():
    """Create sample news articles"""
    existing_news = await db.noticias.count_documents({})
    if existing_news > 0:
        print("✅ Sample news already exist")
        return

    # Get admin user for author
    admin_user = await db.users.find_one({"role": "admin"})
    if not admin_user:
        print("⚠️ No admin user found for news creation")
        return

    news_articles = [
        {
            "id": str(uuid.uuid4()),
            "titulo": "Nova Regulamentação para Locação por Temporada em Ilhabela",
            "subtitulo": "Prefeitura anuncia novas diretrizes que entram em vigor no próximo mês",
            "conteudo": """A Prefeitura de Ilhabela anunciou hoje novas regulamentações para o setor de locação por temporada que entrarão em vigor no próximo mês. As mudanças visam organizar melhor o setor e garantir maior qualidade nos serviços oferecidos aos turistas.

Entre as principais mudanças estão:

• Cadastro obrigatório de todos os imóveis destinados à locação por temporada
• Certificação de segurança para propriedades com mais de 6 pessoas
• Implementação de taxa de turismo diferenciada por região
• Criação de canal direto para reclamações e sugestões

A ALT Ilhabela está trabalhando em parceria com a Prefeitura para facilitar o processo de adequação de todos os associados às novas normas.

Reuniões informativas serão realizadas nos próximos dias para esclarecer dúvidas e orientar os proprietários sobre os procedimentos necessários.""",
            "resumo": "Prefeitura anuncia novas regulamentações para locação por temporada com foco na qualidade e organização do setor.",
            "categoria": "regulamentacao",
            "autor_id": admin_user['id'],
            "autor_nome": admin_user['nome'],
            "video_url": "",
            "link_externo": "https://ilhabela.sp.gov.br/regulamentacao-turismo",
            "tags": ["regulamentacao", "prefeitura", "locacao", "temporada"],
            "destaque": True,
            "ativo": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "titulo": "Festival de Inverno de Ilhabela 2024",
            "subtitulo": "Programação especial promete aquecer a baixa temporada",
            "conteudo": """O Festival de Inverno de Ilhabela 2024 está chegando com uma programação especial para aquecer a baixa temporada turística. O evento, que acontece de 15 a 30 de julho, promete movimentar a economia local e oferecer aos visitantes experiências únicas.

PROGRAMAÇÃO HIGHLIGHTS:

🎵 Shows Musicais
- Apresentações de artistas locais e nacionais
- Palco na Praça Coronel Julião de Moura Negrão
- Shows gratuitos todas as sextas, sábados e domingos

🍽️ Festival Gastronômico
- Pratos especiais nos restaurantes participantes
- Menu degustação com preços promocionais
- Concurso de melhor prato caiçara

🎭 Atividades Culturais
- Exposições de arte local
- Teatro e apresentações folclóricas
- Oficinas de artesanato

Para os proprietários de imóveis de temporada, esta é uma excelente oportunidade para aumentar a ocupação durante o inverno. A ALT Ilhabela está oferecendo suporte especial para divulgação dos imóveis durante o período do festival.""",
            "resumo": "Festival de Inverno movimenta Ilhabela com programação cultural, gastronômica e musical de 15 a 30 de julho.",
            "categoria": "evento",
            "autor_id": admin_user['id'],
            "autor_nome": admin_user['nome'],
            "video_url": "https://youtube.com/watch?v=festival-inverno-2024",
            "link_externo": "",
            "tags": ["festival", "inverno", "turismo", "cultura"],
            "destaque": True,
            "ativo": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "titulo": "Dicas de Sustentabilidade para Propriedades de Temporada",
            "subtitulo": "Como tornar seu imóvel mais eco-friendly e atrair hóspedes conscientes",
            "conteudo": """A sustentabilidade está se tornando cada vez mais importante para os viajantes. Proprietários que investem em práticas eco-friendly não apenas contribuem para a preservação de Ilhabela, mas também atraem um público crescente de turistas conscientes.

DICAS PRÁTICAS:

💡 Eficiência Energética
- Substitua lâmpadas por LED
- Instale sensores de movimento
- Use equipamentos com selo Procel

💧 Economia de Água
- Instale redutores de vazão
- Capture água da chuva para jardim
- Oriente hóspedes sobre uso consciente

♻️ Gestão de Resíduos
- Disponibilize lixeiras para coleta seletiva
- Composte resíduos orgânicos
- Elimine descartáveis desnecessários

🌱 Produtos Locais
- Use produtos de limpeza biodegradáveis
- Ofereça amenities naturais
- Indique fornecedores locais aos hóspedes

A ALT Ilhabela está desenvolvendo um selo de 'Propriedade Sustentável' para reconhecer e divulgar imóveis que adotam essas práticas.""",
            "resumo": "Guia prático para tornar propriedades de temporada mais sustentáveis e atrativas para turistas conscientes.",
            "categoria": "geral",
            "autor_id": admin_user['id'],
            "autor_nome": admin_user['nome'],
            "video_url": "",
            "link_externo": "",
            "tags": ["sustentabilidade", "dicas", "eco-friendly", "turismo"],
            "destaque": False,
            "ativo": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    ]

    await db.noticias.insert_many(news_articles)
    print(f"📰 Created {len(news_articles)} news articles")


async def main():
    try:
        print("🚀 Creating complete user ecosystem for Portal ALT Ilhabela...\n")

        # Create all users
        admin_id = await ensure_admin_user()
        member_id = await create_membro_user()
        partner_id = await create_parceiro_user()
        associado_id = await create_associado_user()

        # Create sample content
        await create_sample_news()

        print("\n" + "="*60)
        print("🎉 COMPLETE USER ECOSYSTEM CREATED!")
        print("="*60)

        print("\n👥 LOGIN CREDENTIALS:")
        print("-" * 40)
        print("🔧 ADMIN (Full Access)")
        print("   Email: admin@alt-ilhabela.com")
        print("   Senha: admin123")
        print("   Acesso: Dashboard, candidaturas, usuários, conteúdo, comunicação")

        print("\n🏠 MEMBRO (Property Owner)")
        print("   Email: membro@alt-ilhabela.com")
        print("   Senha: membro123")
        print("   Acesso: Meus imóveis (3 propriedades), todos os imóveis, parceiros")

        print("\n🏢 PARCEIRO (Business Partner)")
        print("   Email: parceiro@alt-ilhabela.com")
        print("   Senha: parceiro123")
        print("   Acesso: Meu perfil (restaurante), parceiros, notícias")

        print("\n🤝 ASSOCIADO (Supporter)")
        print("   Email: associado@alt-ilhabela.com")
        print("   Senha: associado123")
        print("   Acesso: Início, parceiros, notícias")

        print("\n📊 SAMPLE DATA CREATED:")
        print("-" * 40)
        print("🏡 3 Properties (Casa luxuosa, Apartamento, Chalé)")
        print("🍽️ 1 Restaurant Profile (Vista do Mar)")
        print("📰 3 News Articles (Regulamentação, Festival, Sustentabilidade)")

        print("\n🌐 ACCESS URL:")
        print("-" * 40)
        print("https://temporada-portal.preview.emergentagent.com/login")

        print("\n✅ Ready for complete testing!")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
