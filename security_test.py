#!/usr/bin/env python3
"""
Security Testing for Portal ALT Ilhabela
Test authentication and authorization properly
"""
import requests
import json

# Backend URL from environment
BACKEND_URL = "https://temp-housing.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials
ADMIN_EMAIL = "admin@alt-ilhabela.com"
ADMIN_PASSWORD = "admin123"
MEMBER_EMAIL = "membro@alt-ilhabela.com"
MEMBER_PASSWORD = "membro123"

def test_security():
    session = requests.Session()
    
    print("🔒 TESTING API SECURITY")
    print("=" * 50)
    
    # Test 1: Completely unauthorized access (no token)
    print("\n1. Testing unauthorized access (no token):")
    response = session.get(f"{API_BASE}/meus-imoveis")
    print(f"   GET /api/meus-imoveis without token: {response.status_code}")
    
    if response.status_code == 401:
        print("   ✅ PASS - Correctly returns 401 Unauthorized")
    else:
        print(f"   ❌ FAIL - Expected 401, got {response.status_code}")
    
    # Test 2: Invalid token
    print("\n2. Testing invalid token:")
    session.headers.update({"Authorization": "Bearer invalid_token_here"})
    response = session.get(f"{API_BASE}/meus-imoveis")
    print(f"   GET /api/meus-imoveis with invalid token: {response.status_code}")
    
    if response.status_code == 401:
        print("   ✅ PASS - Correctly rejects invalid token")
    else:
        print(f"   ❌ FAIL - Expected 401, got {response.status_code}")
    
    # Test 3: Valid member token accessing member endpoint
    print("\n3. Testing valid member access:")
    login_data = {"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD}
    response = session.post(f"{API_BASE}/auth/login", json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        token = data["access_token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = session.get(f"{API_BASE}/meus-imoveis")
        print(f"   GET /api/meus-imoveis with valid member token: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ PASS - Member can access their properties")
        else:
            print(f"   ❌ FAIL - Member cannot access their properties: {response.status_code}")
    else:
        print(f"   ❌ FAIL - Member login failed: {response.status_code}")
    
    # Test 4: Member trying to access admin endpoint
    print("\n4. Testing role-based access control:")
    response = session.get(f"{API_BASE}/admin/imoveis-pendentes")
    print(f"   GET /api/admin/imoveis-pendentes with member token: {response.status_code}")
    
    if response.status_code == 403:
        print("   ✅ PASS - Member correctly denied access to admin endpoint")
    else:
        print(f"   ❌ FAIL - Expected 403, got {response.status_code}")
    
    # Test 5: Admin access to admin endpoint
    print("\n5. Testing admin access:")
    login_data = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    response = session.post(f"{API_BASE}/auth/login", json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        token = data["access_token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = session.get(f"{API_BASE}/admin/imoveis-pendentes")
        print(f"   GET /api/admin/imoveis-pendentes with admin token: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ PASS - Admin can access admin endpoints")
        else:
            print(f"   ❌ FAIL - Admin cannot access admin endpoints: {response.status_code}")
    else:
        print(f"   ❌ FAIL - Admin login failed: {response.status_code}")
    
    print("\n🔒 Security test completed!")

if __name__ == "__main__":
    test_security()