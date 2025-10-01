#!/usr/bin/env python3
"""
Photo System Testing for Portal ALT Ilhabela
Testing specific photo upload and property creation with photos functionality
"""
import requests
import json
import sys
import io
import tempfile
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://temp-housing.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials
MEMBER_EMAIL = "test-member@alt-ilhabela.com"
MEMBER_PASSWORD = "testmember123"

class PhotoSystemTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        self.uploaded_photo_url = None
        self.uploaded_filename = None
        self.test_property_id = None
        
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
        
    def test_login(self):
        """Test member login"""
        try:
            login_data = {
                "email": MEMBER_EMAIL,
                "password": MEMBER_PASSWORD
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
                        "Member Login", 
                        True, 
                        f"Login successful for {user_info.get('email', 'unknown')} with role {user_info.get('role', 'unknown')}"
                    )
                    return True
                else:
                    self.log_result("Member Login", False, "No access token in response")
                    return False
            else:
                self.log_result("Member Login", False, f"Login failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Member Login", False, f"Login error: {str(e)}")
            return False

    def test_photo_upload_system(self):
        """Test POST /api/upload/foto endpoint - photo upload system"""
        try:
            # Create a temporary text file to simulate image upload
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
                tmp_file.write(b"fake image content for testing photo upload system")
                tmp_file.flush()
                
                with open(tmp_file.name, 'rb') as f:
                    files = {
                        'file': ('test_photo.jpg', f, 'image/jpeg')
                    }
                    
                    response = self.session.post(f"{API_BASE}/upload/foto", files=files)
                    
                    if response.status_code == 200:
                        data = response.json()
                        
                        if "url" in data and "filename" in data:
                            photo_url = data.get("url")
                            filename = data.get("filename")
                            
                            # Store for later tests
                            self.uploaded_photo_url = photo_url
                            self.uploaded_filename = filename
                            
                            self.log_result(
                                "Photo Upload System", 
                                True, 
                                f"✅ Photo uploaded successfully. URL: {photo_url}",
                                {
                                    "photo_url": photo_url,
                                    "filename": filename,
                                    "response": data
                                }
                            )
                            return True
                        else:
                            self.log_result(
                                "Photo Upload System", 
                                False, 
                                f"Photo upload response missing required fields: {data}"
                            )
                            return False
                    else:
                        self.log_result(
                            "Photo Upload System", 
                            False, 
                            f"Photo upload failed - Status {response.status_code}: {response.text}"
                        )
                        return False
                        
        except Exception as e:
            self.log_result("Photo Upload System", False, f"Photo upload test error: {str(e)}")
            return False

    def test_photo_upload_file_restrictions(self):
        """Test photo upload file type restrictions"""
        try:
            # Create a text file (invalid type)
            text_content = io.BytesIO(b"This is not an image file")
            
            files = {
                'file': ('test.txt', text_content, 'text/plain')
            }
            
            response = self.session.post(f"{API_BASE}/upload/foto", files=files)
            
            # Should fail with 400 status for invalid file type
            if response.status_code == 400:
                error_data = response.json()
                error_message = error_data.get("detail", "").lower()
                
                if "tipo" in error_message or "type" in error_message or "permitido" in error_message:
                    self.log_result(
                        "Photo Upload File Type Restriction", 
                        True, 
                        f"✅ Correctly rejected invalid file type: {error_data.get('detail')}",
                        {"response": error_data}
                    )
                    return True
                else:
                    self.log_result(
                        "Photo Upload File Type Restriction", 
                        False, 
                        f"Invalid file type rejected but error message unclear: {error_data.get('detail')}"
                    )
                    return False
            else:
                self.log_result(
                    "Photo Upload File Type Restriction", 
                    False, 
                    f"❌ SECURITY ISSUE: Invalid file type was accepted - Status {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result("Photo Upload File Type Restriction", False, f"Request error: {str(e)}")
            return False

    def test_create_property_with_photos(self):
        """Test property creation with photo URLs - end-to-end photo system"""
        try:
            # Use uploaded photo URL if available, otherwise use placeholder
            photo_urls = []
            if hasattr(self, 'uploaded_photo_url') and self.uploaded_photo_url:
                photo_urls = [self.uploaded_photo_url]
            else:
                # Use placeholder URLs for testing
                photo_urls = ["/uploads/placeholder1.jpg", "/uploads/placeholder2.jpg"]
            
            property_data = {
                "titulo": "Casa com Sistema de Fotos Completo",
                "descricao": "Teste end-to-end do sistema de fotos implementado com sucesso",
                "tipo": "casa",
                "regiao": "centro", 
                "endereco_completo": "Rua do Sistema de Fotos Funcionando, 789",
                "preco_diaria": 400.0,
                "num_quartos": 4,
                "num_banheiros": 3,
                "capacidade": 8,
                "area_m2": 180,
                "possui_piscina": True,
                "possui_churrasqueira": True,
                "possui_wifi": True,
                "permite_pets": True,
                "tem_vista_mar": True,
                "tem_ar_condicionado": True,
                "fotos": photo_urls,  # Include photo URLs
                "link_booking": "",
                "link_airbnb": ""
            }
            
            response = self.session.post(f"{API_BASE}/imoveis", json=property_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Store property ID for later tests
                self.test_property_id = data.get("id")
                
                # Verify the property was created with photos
                if data.get("status_aprovacao") == "pendente":
                    created_photos = data.get("fotos", [])
                    
                    if len(created_photos) == len(photo_urls):
                        # Verify photos are stored as strings
                        photos_are_strings = all(isinstance(url, str) for url in created_photos)
                        
                        if photos_are_strings:
                            self.log_result(
                                "Property Creation with Photos", 
                                True, 
                                f"✅ Property with photos created successfully. {len(created_photos)} photos stored correctly.",
                                {
                                    "property_id": data.get("id"),
                                    "titulo": data.get("titulo"),
                                    "fotos_count": len(created_photos),
                                    "fotos": created_photos,
                                    "status_aprovacao": data.get("status_aprovacao")
                                }
                            )
                            return True
                        else:
                            self.log_result(
                                "Property Creation with Photos", 
                                False, 
                                f"Property created but photos not stored as strings: {created_photos}"
                            )
                            return False
                    else:
                        self.log_result(
                            "Property Creation with Photos", 
                            False, 
                            f"Property created but photo count mismatch. Expected: {len(photo_urls)}, Got: {len(created_photos)}"
                        )
                        return False
                else:
                    self.log_result(
                        "Property Creation with Photos", 
                        False, 
                        f"Property created but status_aprovacao is '{data.get('status_aprovacao')}' instead of 'pendente'"
                    )
                    return False
            else:
                self.log_result(
                    "Property Creation with Photos", 
                    False, 
                    f"Property creation with photos failed - Status {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result("Property Creation with Photos", False, f"Request error: {str(e)}")
            return False

    def test_property_creation_500_error_fix(self):
        """Test the specific 500 error fix for property creation with BSON/HttpUrl issues"""
        try:
            # Test data exactly as specified in review request
            property_data = {
                "titulo": "Casa Teste Fotos",
                "descricao": "Casa de teste com sistema de fotos implementado",
                "tipo": "casa",
                "regiao": "centro", 
                "endereco_completo": "Rua das Fotos, 123",
                "preco_diaria": 250.0,
                "num_quartos": 3,
                "num_banheiros": 2,
                "capacidade": 6,
                "area_m2": 120,
                "possui_piscina": False,
                "possui_churrasqueira": True,
                "possui_wifi": True,
                "permite_pets": False,
                "tem_vista_mar": True,
                "tem_ar_condicionado": True,
                "fotos": [],
                "link_booking": "",
                "link_airbnb": ""
            }
            
            response = self.session.post(f"{API_BASE}/imoveis", json=property_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify the property was created successfully (not 500 error)
                if data.get("status_aprovacao") == "pendente":
                    # Verify empty URLs were handled correctly (should be null, not empty strings)
                    url_fields_handled = True
                    url_issues = []
                    
                    for field in ["link_booking", "link_airbnb"]:
                        if data.get(field) == "":
                            url_fields_handled = False
                            url_issues.append(f"{field} is empty string instead of null")
                    
                    if url_fields_handled:
                        self.log_result(
                            "Property Creation 500 Error Fix", 
                            True, 
                            f"✅ 500 ERROR FIXED! Property created successfully with status 'pendente'. BSON/HttpUrl serialization working correctly.",
                            {
                                "property_id": data.get("id"),
                                "status_aprovacao": data.get("status_aprovacao"),
                                "titulo": data.get("titulo"),
                                "link_booking": data.get("link_booking"),
                                "link_airbnb": data.get("link_airbnb"),
                                "fotos": data.get("fotos", [])
                            }
                        )
                        return True
                    else:
                        self.log_result(
                            "Property Creation 500 Error Fix", 
                            False, 
                            f"Property created but URL field handling failed: {', '.join(url_issues)}"
                        )
                        return False
                else:
                    self.log_result(
                        "Property Creation 500 Error Fix", 
                        False, 
                        f"Property created but status_aprovacao is '{data.get('status_aprovacao')}' instead of 'pendente'"
                    )
                    return False
            else:
                # Check if this is still a 500 error or other error
                if response.status_code == 500:
                    self.log_result(
                        "Property Creation 500 Error Fix", 
                        False, 
                        f"❌ 500 ERROR STILL EXISTS - BSON/HttpUrl serialization issue not fixed: {response.text}"
                    )
                else:
                    self.log_result(
                        "Property Creation 500 Error Fix", 
                        False, 
                        f"Property creation failed with status {response.status_code}: {response.text}"
                    )
                return False
                
        except Exception as e:
            self.log_result("Property Creation 500 Error Fix", False, f"Request error: {str(e)}")
            return False

    def run_photo_system_tests(self):
        """Run all photo system tests"""
        print(f"🚀 Starting Portal ALT Ilhabela Photo System Tests")
        print(f"📍 Backend URL: {BACKEND_URL}")
        print(f"🔑 Testing with member credentials: {MEMBER_EMAIL}")
        print("=" * 60)
        
        # Test authentication
        if not self.test_login():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Test the specific photo system functionality
        print("\n📸 Testing Photo System Functionality:")
        print("1. Property Creation 500 Error Fix (BSON/HttpUrl):")
        self.test_property_creation_500_error_fix()
        
        print("\n2. Photo Upload System:")
        self.test_photo_upload_system()
        self.test_photo_upload_file_restrictions()
        
        print("\n3. Property Creation with Photos (End-to-End):")
        self.test_create_property_with_photos()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 PHOTO SYSTEM TEST SUMMARY:")
        
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
    tester = PhotoSystemTester()
    success = tester.run_photo_system_tests()
    
    # Save detailed results
    with open("/app/photo_system_test_results.json", "w") as f:
        json.dump(tester.test_results, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/photo_system_test_results.json")
    
    if success:
        print("🎉 All photo system tests passed!")
        sys.exit(0)
    else:
        print("⚠️  Some photo system tests failed - check results above")
        sys.exit(1)

if __name__ == "__main__":
    main()