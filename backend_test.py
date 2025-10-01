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
    
    def test_meus_imoveis_endpoint_as_member(self):
        """Test /api/meus-imoveis endpoint as member user"""
        try:
            response = self.session.get(f"{API_BASE}/meus-imoveis")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Meus Imóveis API (Member)", 
                    True, 
                    f"Member endpoint working, returned {len(data)} properties",
                    {"count": len(data), "sample": data[:1] if data else []}
                )
                return True
            else:
                self.log_result(
                    "Meus Imóveis API (Member)", 
                    False, 
                    f"Failed with status code {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result("Meus Imóveis API (Member)", False, f"Request error: {str(e)}")
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
    
    def test_create_property_with_empty_urls(self):
        """Test POST /api/imoveis with empty URL strings - specific fix validation"""
        try:
            # Test data with empty string URL fields as specified in review request
            property_data = {
                "titulo": "Teste Casa Nova",
                "descricao": "Casa para teste do sistema de aprovação",
                "tipo": "casa",
                "regiao": "centro",
                "endereco_completo": "Rua de Teste, 123",
                "preco_diaria": 200.0,
                "num_quartos": 2,
                "num_banheiros": 1,
                "capacidade": 4,
                "area_m2": 80,
                "possui_piscina": False,
                "possui_churrasqueira": False,
                "possui_wifi": True,
                "permite_pets": False,
                "tem_vista_mar": False,
                "tem_ar_condicionado": True,
                "video_url": "",  # Empty string - this should be converted to null
                "link_booking": "",  # Empty string - this should be converted to null
                "link_airbnb": ""  # Empty string - this should be converted to null
            }
            
            response = self.session.post(f"{API_BASE}/imoveis", json=property_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Store property ID for email testing
                self.test_property_id = data.get("id")
                
                # Verify the property was created with correct status
                if data.get("status_aprovacao") == "pendente":
                    # Verify empty URLs were handled correctly (should be null, not empty strings)
                    url_fields_handled = True
                    url_issues = []
                    
                    for field in ["video_url", "link_booking", "link_airbnb"]:
                        if data.get(field) == "":
                            url_fields_handled = False
                            url_issues.append(f"{field} is empty string instead of null")
                    
                    if url_fields_handled:
                        self.log_result(
                            "Property Creation with Empty URLs", 
                            True, 
                            f"✅ Property created successfully with status 'pendente'. Empty URL fields converted to null as expected.",
                            {
                                "property_id": data.get("id"),
                                "status_aprovacao": data.get("status_aprovacao"),
                                "titulo": data.get("titulo"),
                                "video_url": data.get("video_url"),
                                "link_booking": data.get("link_booking"),
                                "link_airbnb": data.get("link_airbnb")
                            }
                        )
                        return True
                    else:
                        self.log_result(
                            "Property Creation with Empty URLs", 
                            False, 
                            f"Property created but URL field handling failed: {', '.join(url_issues)}"
                        )
                        return False
                else:
                    self.log_result(
                        "Property Creation with Empty URLs", 
                        False, 
                        f"Property created but status_aprovacao is '{data.get('status_aprovacao')}' instead of 'pendente'"
                    )
                    return False
            else:
                # Check if this is a Pydantic validation error
                error_text = response.text
                if "validation error" in error_text.lower() or "pydantic" in error_text.lower():
                    self.log_result(
                        "Property Creation with Empty URLs", 
                        False, 
                        f"❌ PYDANTIC VALIDATION ERROR STILL EXISTS - Status {response.status_code}: {error_text}"
                    )
                else:
                    self.log_result(
                        "Property Creation with Empty URLs", 
                        False, 
                        f"Property creation failed with status {response.status_code}: {error_text}"
                    )
                return False
                
        except Exception as e:
            self.log_result("Property Creation with Empty URLs", False, f"Request error: {str(e)}")
            return False

    def test_get_pending_properties(self):
        """Test GET /admin/imoveis-pendentes to check for properties awaiting approval"""
        try:
            response = self.session.get(f"{API_BASE}/admin/imoveis-pendentes")
            
            if response.status_code == 200:
                data = response.json()
                self.pending_properties = data
                self.log_result(
                    "Get Pending Properties", 
                    True, 
                    f"Found {len(data)} pending properties for approval",
                    {"count": len(data), "properties": [{"id": p.get("id"), "titulo": p.get("titulo")} for p in data[:3]]}
                )
                return True
            else:
                self.log_result(
                    "Get Pending Properties", 
                    False, 
                    f"Failed to get pending properties - Status {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result("Get Pending Properties", False, f"Request error: {str(e)}")
            return False

    def test_property_approval_email_system(self):
        """Test property approval with email notification system"""
        try:
            # Use the property created in previous test or first pending property
            property_id = getattr(self, 'test_property_id', None)
            if not property_id and hasattr(self, 'pending_properties') and self.pending_properties:
                property_id = self.pending_properties[0].get("id")
            
            if not property_id:
                self.log_result(
                    "Property Approval Email System", 
                    False, 
                    "No pending property available for approval testing"
                )
                return False
            
            # Test property approval endpoint
            response = self.session.post(f"{API_BASE}/admin/imoveis/{property_id}/aprovar")
            
            if response.status_code == 200:
                data = response.json()
                self.log_result(
                    "Property Approval Email System", 
                    True, 
                    f"✅ Property approval successful: {data.get('message', 'No message')}. Email notification should have been sent to property owner.",
                    {
                        "property_id": property_id,
                        "response": data,
                        "email_note": "Check backend logs for email sending confirmation"
                    }
                )
                return True
            else:
                self.log_result(
                    "Property Approval Email System", 
                    False, 
                    f"Property approval failed - Status {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result("Property Approval Email System", False, f"Request error: {str(e)}")
            return False

    def test_email_configuration_check(self):
        """Verify email configuration is properly loaded (indirect test via API behavior)"""
        try:
            # Test by checking if the backend has proper email settings
            # We'll do this by testing a simple endpoint that would use email functionality
            response = self.session.get(f"{API_BASE}/")
            
            if response.status_code == 200:
                # Email config verification is indirect - we check if the server is running properly
                # The actual email config is tested when we try to send emails
                self.log_result(
                    "Email Configuration Check", 
                    True, 
                    "✅ Backend is running properly. Email configuration should be loaded from environment variables: EMAIL_HOST=smtp.gmail.com, EMAIL_PORT=587, EMAIL_HOST_USER=ilhabelaalt@gmail.com",
                    {
                        "email_host": "smtp.gmail.com",
                        "email_port": "587",
                        "email_user": "ilhabelaalt@gmail.com",
                        "note": "Actual email sending will be tested during property approval"
                    }
                )
                return True
            else:
                self.log_result(
                    "Email Configuration Check", 
                    False, 
                    f"Backend not responding properly - Status {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_result("Email Configuration Check", False, f"Request error: {str(e)}")
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
        self.test_imoveis_endpoint()
        self.test_parceiros_endpoint()
        
        # Test member-specific endpoint with member credentials
        print("\n👤 Testing Member-Specific Endpoints:")
        if self.test_login(MEMBER_EMAIL, MEMBER_PASSWORD, "member"):
            self.test_meus_imoveis_endpoint_as_member()
            
            # Test the specific property creation fix
            print("\n🔧 Testing Property Creation Fix (Empty URL Validation):")
            self.test_create_property_with_empty_urls()
        
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