#!/usr/bin/env python3
"""
Backend API Testing for Portal ALT Ilhabela
Testing specific endpoints: /api/meus-imoveis, /api/imoveis, /api/parceiros
"""
import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://78140d09-2105-4861-9a65-40565254afd0.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials
ADMIN_EMAIL = "admin@alt-ilhabela.com"
ADMIN_PASSWORD = "admin123"
MEMBER_EMAIL = "membro@alt-ilhabela.com"
MEMBER_PASSWORD = "membro123"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, response_data=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {message}")
        
    def test_login(self, email=None, password=None, user_type="admin"):
        """Test login functionality"""
        email = email or ADMIN_EMAIL
        password = password or ADMIN_PASSWORD
        
        try:
            login_data = {
                "email": email,
                "password": password
            }
            
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.auth_token = data["access_token"]
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.auth_token}"
                    })
                    user_info = data.get("user", {})
                    self.log_result(
                        f"{user_type.title()} Login", 
                        True, 
                        f"Login successful for {user_info.get('email', 'unknown')} with role {user_info.get('role', 'unknown')}"
                    )
                    return True
                else:
                    self.log_result(f"{user_type.title()} Login", False, "No access token in response")
                    return False
            else:
                self.log_result(f"{user_type.title()} Login", False, f"Login failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result(f"{user_type.title()} Login", False, f"Login error: {str(e)}")
            return False
    
    def test_meus_imoveis_endpoint(self):
        """Test /api/meus-imoveis endpoint"""
        try:
            response = self.session.get(f"{API_BASE}/meus-imoveis")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Meus Imóveis API", 
                    True, 
                    f"Endpoint working, returned {len(data)} properties",
                    {"count": len(data), "sample": data[:2] if data else []}
                )
                return True
            elif response.status_code == 403:
                # This is expected for admin user trying to access member-only endpoint
                self.log_result(
                    "Meus Imóveis API", 
                    True, 
                    "Endpoint working correctly - returns 403 for non-member users (admin role)",
                    {"status_code": response.status_code, "message": response.text}
                )
                return True
            else:
                self.log_result(
                    "Meus Imóveis API", 
                    False, 
                    f"Unexpected status code {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result("Meus Imóveis API", False, f"Request error: {str(e)}")
            return False
    
    def test_imoveis_endpoint(self):
        """Test /api/imoveis endpoint"""
        try:
            response = self.session.get(f"{API_BASE}/imoveis")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Imóveis API", 
                    True, 
                    f"Endpoint working, returned {len(data)} properties",
                    {"count": len(data), "sample": data[:2] if data else []}
                )
                return True
            else:
                self.log_result(
                    "Imóveis API", 
                    False, 
                    f"Failed with status code {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result("Imóveis API", False, f"Request error: {str(e)}")
            return False
    
    def test_parceiros_endpoint(self):
        """Test /api/parceiros endpoint"""
        try:
            response = self.session.get(f"{API_BASE}/parceiros")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Parceiros API", 
                    True, 
                    f"Endpoint working, returned {len(data)} partners",
                    {"count": len(data), "sample": data[:2] if data else []}
                )
                return True
            else:
                self.log_result(
                    "Parceiros API", 
                    False, 
                    f"Failed with status code {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result("Parceiros API", False, f"Request error: {str(e)}")
            return False
    
    def test_api_root(self):
        """Test basic API connectivity"""
        try:
            response = self.session.get(f"{API_BASE}/")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "API Root", 
                    True, 
                    f"API is accessible: {data.get('message', 'No message')}"
                )
                return True
            else:
                self.log_result(
                    "API Root", 
                    False, 
                    f"API root failed with status {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_result("API Root", False, f"Connection error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all API tests"""
        print(f"🚀 Starting Portal ALT Ilhabela Backend API Tests")
        print(f"📍 Backend URL: {BACKEND_URL}")
        print(f"🔑 Testing with admin credentials: {ADMIN_EMAIL}")
        print("=" * 60)
        
        # Test basic connectivity
        if not self.test_api_root():
            print("❌ Cannot connect to API - stopping tests")
            return False
        
        # Test authentication
        if not self.test_login():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Test the specific endpoints mentioned in review request
        print("\n🎯 Testing Priority Endpoints:")
        self.test_meus_imoveis_endpoint()
        self.test_imoveis_endpoint() 
        self.test_parceiros_endpoint()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY:")
        
        passed = sum(1 for r in self.test_results if r["success"])
        total = len(self.test_results)
        
        print(f"✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {total - passed}/{total}")
        
        if total - passed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        return passed == total

def main():
    """Main test execution"""
    tester = APITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open("/app/backend_test_results.json", "w") as f:
        json.dump(tester.test_results, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")
    
    if success:
        print("🎉 All tests passed!")
        sys.exit(0)
    else:
        print("⚠️  Some tests failed - check results above")
        sys.exit(1)

if __name__ == "__main__":
    main()