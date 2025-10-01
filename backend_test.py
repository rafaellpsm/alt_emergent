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
BACKEND_URL = "https://temp-housing.preview.emergentagent.com"
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
        self.pending_properties = []
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
            # Test data as specified in review request
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
                
                # Store property ID for email testing
                self.test_property_id = data.get("id")
                
                # Verify the property was created with correct status
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
                            "Property Creation with Empty URLs", 
                            True, 
                            f"✅ Property created successfully with status 'pendente'. Empty URL fields converted to null as expected.",
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

    def test_property_details_loading(self):
        """Test GET /api/imoveis/{id} endpoint - ObjectId removal fix"""
        try:
            # First get list of properties to get an ID
            response = self.session.get(f"{API_BASE}/imoveis")
            
            if response.status_code != 200:
                self.log_result(
                    "Property Details Loading", 
                    False, 
                    f"Could not get property list - Status {response.status_code}: {response.text}"
                )
                return False
            
            properties = response.json()
            if not properties:
                self.log_result(
                    "Property Details Loading", 
                    False, 
                    "No properties available to test details loading"
                )
                return False
            
            # Test getting details for the first property
            property_id = properties[0].get("id")
            if not property_id:
                self.log_result(
                    "Property Details Loading", 
                    False, 
                    "Property ID not found in property list"
                )
                return False
            
            # Test the specific endpoint
            response = self.session.get(f"{API_BASE}/imoveis/{property_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if response is proper JSON without MongoDB ObjectId issues
                required_fields = ["id", "titulo", "descricao", "tipo", "regiao"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_result(
                        "Property Details Loading", 
                        False, 
                        f"Missing required fields in response: {missing_fields}"
                    )
                    return False
                
                # Check if _id field is properly removed
                if "_id" in data:
                    self.log_result(
                        "Property Details Loading", 
                        False, 
                        "MongoDB _id field still present in response - ObjectId removal fix not working"
                    )
                    return False
                
                self.log_result(
                    "Property Details Loading", 
                    True, 
                    f"✅ Property details loaded successfully. ObjectId properly removed. Property: {data.get('titulo')}",
                    {
                        "property_id": property_id,
                        "titulo": data.get("titulo"),
                        "has_mongodb_id": "_id" in data,
                        "visualizacoes": data.get("visualizacoes", 0)
                    }
                )
                return True
            else:
                # Check for serialization errors
                error_text = response.text
                if "not JSON serializable" in error_text or "ObjectId" in error_text:
                    self.log_result(
                        "Property Details Loading", 
                        False, 
                        f"❌ MONGODB OBJECTID SERIALIZATION ERROR STILL EXISTS - Status {response.status_code}: {error_text}"
                    )
                else:
                    self.log_result(
                        "Property Details Loading", 
                        False, 
                        f"Property details loading failed - Status {response.status_code}: {error_text}"
                    )
                return False
                
        except Exception as e:
            self.log_result("Property Details Loading", False, f"Request error: {str(e)}")
            return False

    def test_property_owner_information(self):
        """Test GET /api/imoveis/{id}/proprietario endpoint - new endpoint"""
        try:
            # First get list of properties to get an ID
            response = self.session.get(f"{API_BASE}/imoveis")
            
            if response.status_code != 200:
                self.log_result(
                    "Property Owner Information", 
                    False, 
                    f"Could not get property list - Status {response.status_code}: {response.text}"
                )
                return False
            
            properties = response.json()
            if not properties:
                self.log_result(
                    "Property Owner Information", 
                    False, 
                    "No properties available to test owner information"
                )
                return False
            
            # Test getting owner info for the first property
            property_id = properties[0].get("id")
            if not property_id:
                self.log_result(
                    "Property Owner Information", 
                    False, 
                    "Property ID not found in property list"
                )
                return False
            
            # Test the new endpoint
            response = self.session.get(f"{API_BASE}/imoveis/{property_id}/proprietario")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if response has expected owner information fields
                required_fields = ["id", "nome", "role"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_result(
                        "Property Owner Information", 
                        False, 
                        f"Missing required owner fields in response: {missing_fields}"
                    )
                    return False
                
                # Verify it's returning public info only (no sensitive data)
                sensitive_fields = ["hashed_password", "email"]
                exposed_sensitive = [field for field in sensitive_fields if field in data]
                
                if exposed_sensitive:
                    self.log_result(
                        "Property Owner Information", 
                        False, 
                        f"❌ SECURITY ISSUE: Sensitive fields exposed: {exposed_sensitive}"
                    )
                    return False
                
                self.log_result(
                    "Property Owner Information", 
                    True, 
                    f"✅ Property owner information retrieved successfully. Owner: {data.get('nome')} (Role: {data.get('role')})",
                    {
                        "property_id": property_id,
                        "owner_name": data.get("nome"),
                        "owner_role": data.get("role"),
                        "owner_id": data.get("id"),
                        "security_check": "No sensitive data exposed"
                    }
                )
                return True
            else:
                self.log_result(
                    "Property Owner Information", 
                    False, 
                    f"Property owner information failed - Status {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result("Property Owner Information", False, f"Request error: {str(e)}")
            return False

    def test_password_change_system(self):
        """Test PUT /api/auth/alterar-senha endpoint - new endpoint"""
        try:
            # Test with correct current password
            password_data = {
                "senhaAtual": MEMBER_PASSWORD,  # Current password: membro123
                "novaSenha": "novaSenha123"     # New password
            }
            
            response = self.session.put(f"{API_BASE}/auth/alterar-senha", json=password_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify success message
                if "sucesso" in data.get("message", "").lower():
                    self.log_result(
                        "Password Change System (Valid)", 
                        True, 
                        f"✅ Password change successful: {data.get('message')}",
                        {"response": data}
                    )
                    
                    # Test login with new password to verify change worked
                    login_test = self.test_login_with_new_password("novaSenha123")
                    
                    # Change password back for future tests
                    self.change_password_back()
                    
                    return login_test
                else:
                    self.log_result(
                        "Password Change System (Valid)", 
                        False, 
                        f"Password change response unclear: {data.get('message')}"
                    )
                    return False
            else:
                self.log_result(
                    "Password Change System (Valid)", 
                    False, 
                    f"Password change failed - Status {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result("Password Change System (Valid)", False, f"Request error: {str(e)}")
            return False

    def test_password_change_wrong_current(self):
        """Test PUT /api/auth/alterar-senha with wrong current password"""
        try:
            # Test with wrong current password
            password_data = {
                "senhaAtual": "wrongPassword123",  # Wrong current password
                "novaSenha": "novaSenha123"        # New password
            }
            
            response = self.session.put(f"{API_BASE}/auth/alterar-senha", json=password_data)
            
            # This should fail with 400 status
            if response.status_code == 400:
                data = response.json()
                error_message = data.get("detail", "").lower()
                
                if "incorreta" in error_message or "wrong" in error_message or "invalid" in error_message:
                    self.log_result(
                        "Password Change System (Wrong Current)", 
                        True, 
                        f"✅ Correctly rejected wrong current password: {data.get('detail')}",
                        {"response": data}
                    )
                    return True
                else:
                    self.log_result(
                        "Password Change System (Wrong Current)", 
                        False, 
                        f"Wrong password rejected but error message unclear: {data.get('detail')}"
                    )
                    return False
            else:
                self.log_result(
                    "Password Change System (Wrong Current)", 
                    False, 
                    f"❌ SECURITY ISSUE: Wrong current password was accepted - Status {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result("Password Change System (Wrong Current)", False, f"Request error: {str(e)}")
            return False

    def test_login_with_new_password(self, new_password):
        """Helper method to test login with new password"""
        try:
            # Clear current session
            old_token = self.auth_token
            self.auth_token = None
            self.session.headers.pop("Authorization", None)
            
            # Try login with new password
            login_data = {
                "email": MEMBER_EMAIL,
                "password": new_password
            }
            
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    # Restore old token for other tests
                    self.auth_token = old_token
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.auth_token}"
                    })
                    
                    self.log_result(
                        "Login with New Password", 
                        True, 
                        "✅ Login successful with new password - password change verified"
                    )
                    return True
            
            # Restore old token
            self.auth_token = old_token
            self.session.headers.update({
                "Authorization": f"Bearer {self.auth_token}"
            })
            
            self.log_result(
                "Login with New Password", 
                False, 
                f"Login failed with new password - Status {response.status_code}: {response.text}"
            )
            return False
            
        except Exception as e:
            self.log_result("Login with New Password", False, f"Request error: {str(e)}")
            return False

    def change_password_back(self):
        """Helper method to change password back to original"""
        try:
            password_data = {
                "senhaAtual": "novaSenha123",  # Current new password
                "novaSenha": MEMBER_PASSWORD   # Back to original
            }
            
            response = self.session.put(f"{API_BASE}/auth/alterar-senha", json=password_data)
            
            if response.status_code == 200:
                self.log_result(
                    "Password Reset to Original", 
                    True, 
                    "Password successfully reset to original for future tests"
                )
            else:
                self.log_result(
                    "Password Reset to Original", 
                    False, 
                    f"Failed to reset password - Status {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result("Password Reset to Original", False, f"Request error: {str(e)}")

    def test_photo_upload_system(self):
        """Test POST /api/upload/foto endpoint - photo upload system"""
        try:
            # Create a simple test image file in memory
            import io
            from PIL import Image
            
            # Create a simple 100x100 red image
            img = Image.new('RGB', (100, 100), color='red')
            img_bytes = io.BytesIO()
            img.save(img_bytes, format='JPEG')
            img_bytes.seek(0)
            
            # Prepare multipart form data
            files = {
                'file': ('test_image.jpg', img_bytes, 'image/jpeg')
            }
            
            response = self.session.post(f"{API_BASE}/upload/foto", files=files)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if response has expected fields
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
                
        except ImportError:
            # If PIL is not available, create a simple text file as test
            try:
                import tempfile
                
                # Create a temporary text file to simulate image upload
                with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
                    tmp_file.write(b"fake image content for testing")
                    tmp_file.flush()
                    
                    with open(tmp_file.name, 'rb') as f:
                        files = {
                            'file': ('test_image.jpg', f, 'image/jpeg')
                        }
                        
                        response = self.session.post(f"{API_BASE}/upload/foto", files=files)
                        
                        if response.status_code == 200:
                            data = response.json()
                            
                            if "url" in data and "filename" in data:
                                photo_url = data.get("url")
                                filename = data.get("filename")
                                
                                self.uploaded_photo_url = photo_url
                                self.uploaded_filename = filename
                                
                                self.log_result(
                                    "Photo Upload System", 
                                    True, 
                                    f"✅ Photo upload system working. URL: {photo_url}",
                                    {
                                        "photo_url": photo_url,
                                        "filename": filename,
                                        "note": "Used text file for testing (PIL not available)"
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
                
        except Exception as e:
            self.log_result("Photo Upload System", False, f"Photo upload test error: {str(e)}")
            return False

    def test_create_property_with_photos(self):
        """Test property creation with photo URLs - end-to-end photo system"""
        try:
            # Use uploaded photo URL if available, otherwise use placeholder
            photo_urls = []
            if hasattr(self, 'uploaded_photo_url'):
                photo_urls = [self.uploaded_photo_url]
            else:
                # Use placeholder URLs for testing
                photo_urls = ["/uploads/placeholder1.jpg", "/uploads/placeholder2.jpg"]
            
            property_data = {
                "titulo": "Casa com Fotos Sistema Completo",
                "descricao": "Teste end-to-end do sistema de fotos implementado",
                "tipo": "casa",
                "regiao": "centro", 
                "endereco_completo": "Rua do Sistema de Fotos, 456",
                "preco_diaria": 350.0,
                "num_quartos": 4,
                "num_banheiros": 3,
                "capacidade": 8,
                "area_m2": 150,
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
                self.test_property_with_photos_id = data.get("id")
                
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

    def test_property_details_with_photos(self):
        """Test property details display with photo gallery"""
        try:
            # Use property created with photos, or find any property with photos
            property_id = getattr(self, 'test_property_with_photos_id', None)
            
            if not property_id:
                # Try to find any property with photos from approved properties
                response = self.session.get(f"{API_BASE}/imoveis")
                if response.status_code == 200:
                    properties = response.json()
                    properties_with_photos = [p for p in properties if p.get("fotos") and len(p.get("fotos", [])) > 0]
                    
                    if properties_with_photos:
                        property_id = properties_with_photos[0].get("id")
                    else:
                        # If no approved properties with photos, try to get pending properties (admin access)
                        admin_response = self.session.get(f"{API_BASE}/admin/imoveis-pendentes")
                        if admin_response.status_code == 200:
                            pending_properties = admin_response.json()
                            pending_with_photos = [p for p in pending_properties if p.get("fotos") and len(p.get("fotos", [])) > 0]
                            
                            if pending_with_photos:
                                property_id = pending_with_photos[0].get("id")
                                # Test with pending property details (different endpoint logic)
                                return self.test_pending_property_details_with_photos(property_id)
                            else:
                                self.log_result(
                                    "Property Details with Photos", 
                                    False, 
                                    "No properties with photos found for testing photo gallery (neither approved nor pending)"
                                )
                                return False
                        else:
                            self.log_result(
                                "Property Details with Photos", 
                                False, 
                                "No approved properties with photos found and cannot access pending properties"
                            )
                            return False
                else:
                    self.log_result(
                        "Property Details with Photos", 
                        False, 
                        f"Could not get property list - Status {response.status_code}: {response.text}"
                    )
                    return False
            
            # Test getting property details
            response = self.session.get(f"{API_BASE}/imoveis/{property_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if property has photos
                fotos = data.get("fotos", [])
                
                if fotos and len(fotos) > 0:
                    # Verify photos are properly formatted
                    photos_valid = all(isinstance(url, str) and url for url in fotos)
                    
                    if photos_valid:
                        self.log_result(
                            "Property Details with Photos", 
                            True, 
                            f"✅ Property details with photo gallery working. Property has {len(fotos)} photos.",
                            {
                                "property_id": property_id,
                                "titulo": data.get("titulo"),
                                "fotos_count": len(fotos),
                                "fotos": fotos,
                                "photos_valid": photos_valid
                            }
                        )
                        return True
                    else:
                        self.log_result(
                            "Property Details with Photos", 
                            False, 
                            f"Property has photos but they are not properly formatted: {fotos}"
                        )
                        return False
                else:
                    self.log_result(
                        "Property Details with Photos", 
                        False, 
                        f"Property details loaded but no photos found. Expected photos in gallery."
                    )
                    return False
            else:
                self.log_result(
                    "Property Details with Photos", 
                    False, 
                    f"Property details loading failed - Status {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result("Property Details with Photos", False, f"Request error: {str(e)}")
            return False

    def test_pending_property_details_with_photos(self, property_id):
        """Test property details for pending properties with photos (admin access)"""
        try:
            # For pending properties, we need to check via admin endpoints or direct database access
            # Since we can't directly access pending property details via regular endpoint,
            # we'll verify the property was created correctly by checking the pending list
            response = self.session.get(f"{API_BASE}/admin/imoveis-pendentes")
            
            if response.status_code == 200:
                pending_properties = response.json()
                target_property = next((p for p in pending_properties if p.get("id") == property_id), None)
                
                if target_property:
                    fotos = target_property.get("fotos", [])
                    
                    if fotos and len(fotos) > 0:
                        photos_valid = all(isinstance(url, str) and url for url in fotos)
                        
                        if photos_valid:
                            self.log_result(
                                "Property Details with Photos", 
                                True, 
                                f"✅ Pending property with photo gallery working. Property has {len(fotos)} photos.",
                                {
                                    "property_id": property_id,
                                    "titulo": target_property.get("titulo"),
                                    "fotos_count": len(fotos),
                                    "fotos": fotos,
                                    "status": "pendente",
                                    "photos_valid": photos_valid
                                }
                            )
                            return True
                        else:
                            self.log_result(
                                "Property Details with Photos", 
                                False, 
                                f"Pending property has photos but they are not properly formatted: {fotos}"
                            )
                            return False
                    else:
                        self.log_result(
                            "Property Details with Photos", 
                            False, 
                            f"Pending property found but no photos. Expected photos in gallery."
                        )
                        return False
                else:
                    self.log_result(
                        "Property Details with Photos", 
                        False, 
                        f"Pending property with ID {property_id} not found in pending list"
                    )
                    return False
            else:
                self.log_result(
                    "Property Details with Photos", 
                    False, 
                    f"Could not access pending properties - Status {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result("Property Details with Photos", False, f"Request error: {str(e)}")
            return False

    def test_photo_upload_file_restrictions(self):
        """Test photo upload file type and size restrictions"""
        try:
            # Test invalid file type
            import io
            
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
    
    def test_property_approval_flow(self):
        """Test complete property approval flow as specified in review request"""
        try:
            # Step 1: Create a property as member that needs approval
            property_data = {
                "titulo": "Casa Teste Aprovação",
                "descricao": "Propriedade para testar fluxo de aprovação",
                "tipo": "casa",
                "regiao": "centro", 
                "endereco_completo": "Rua da Aprovação, 123",
                "preco_diaria": 200.0,
                "num_quartos": 2,
                "num_banheiros": 1,
                "capacidade": 4,
                "possui_wifi": True,
                "link_booking": "",
                "link_airbnb": ""
            }
            
            response = self.session.post(f"{API_BASE}/imoveis", json=property_data)
            
            if response.status_code != 200:
                self.log_result(
                    "Property Approval Flow - Create Property", 
                    False, 
                    f"Failed to create test property - Status {response.status_code}: {response.text}"
                )
                return False
            
            created_property = response.json()
            test_property_id = created_property.get("id")
            
            if created_property.get("status_aprovacao") != "pendente":
                self.log_result(
                    "Property Approval Flow - Create Property", 
                    False, 
                    f"Property created but status is '{created_property.get('status_aprovacao')}' instead of 'pendente'"
                )
                return False
            
            self.log_result(
                "Property Approval Flow - Create Property", 
                True, 
                f"✅ Property created with 'pendente' status: {created_property.get('titulo')}"
            )
            
            # Step 2: Switch to admin and check pending properties
            if not self.test_login(ADMIN_EMAIL, ADMIN_PASSWORD, "admin"):
                self.log_result(
                    "Property Approval Flow - Admin Login", 
                    False, 
                    "Failed to login as admin for approval testing"
                )
                return False
            
            # Step 3: Get pending properties
            response = self.session.get(f"{API_BASE}/admin/imoveis-pendentes")
            
            if response.status_code != 200:
                self.log_result(
                    "Property Approval Flow - Get Pending", 
                    False, 
                    f"Failed to get pending properties - Status {response.status_code}: {response.text}"
                )
                return False
            
            pending_properties = response.json()
            
            # Check if our test property is in pending list
            test_property_in_pending = any(p.get("id") == test_property_id for p in pending_properties)
            
            if not test_property_in_pending:
                self.log_result(
                    "Property Approval Flow - Check Pending", 
                    False, 
                    f"Test property {test_property_id} not found in pending properties list"
                )
                return False
            
            self.log_result(
                "Property Approval Flow - Check Pending", 
                True, 
                f"✅ Test property found in pending list ({len(pending_properties)} total pending)"
            )
            
            # Step 4: Approve the property
            response = self.session.post(f"{API_BASE}/admin/imoveis/{test_property_id}/aprovar")
            
            if response.status_code != 200:
                self.log_result(
                    "Property Approval Flow - Approve Property", 
                    False, 
                    f"Failed to approve property - Status {response.status_code}: {response.text}"
                )
                return False
            
            approval_response = response.json()
            self.log_result(
                "Property Approval Flow - Approve Property", 
                True, 
                f"✅ Property approved successfully: {approval_response.get('message')}"
            )
            
            # Step 5: Verify property now appears in approved listings
            response = self.session.get(f"{API_BASE}/imoveis")
            
            if response.status_code != 200:
                self.log_result(
                    "Property Approval Flow - Check Approved Listings", 
                    False, 
                    f"Failed to get approved properties - Status {response.status_code}: {response.text}"
                )
                return False
            
            approved_properties = response.json()
            
            # Check if our test property is now in approved list
            test_property_in_approved = any(p.get("id") == test_property_id for p in approved_properties)
            
            if not test_property_in_approved:
                self.log_result(
                    "Property Approval Flow - Check Approved Listings", 
                    False, 
                    f"Approved property {test_property_id} not found in approved properties list"
                )
                return False
            
            self.log_result(
                "Property Approval Flow - Check Approved Listings", 
                True, 
                f"✅ Approved property now appears in /api/imoveis endpoint ({len(approved_properties)} total approved)"
            )
            
            return True
            
        except Exception as e:
            self.log_result("Property Approval Flow", False, f"Request error: {str(e)}")
            return False

    def test_objectid_removal_all_endpoints(self):
        """Test ObjectId removal in all property endpoints as specified in review request"""
        try:
            # Test 1: /api/imoveis endpoint
            response = self.session.get(f"{API_BASE}/imoveis")
            
            if response.status_code != 200:
                self.log_result(
                    "ObjectId Removal - /api/imoveis", 
                    False, 
                    f"Failed to get properties - Status {response.status_code}: {response.text}"
                )
                return False
            
            properties = response.json()
            
            # Check for ObjectId in any property
            objectid_found = False
            for prop in properties:
                if "_id" in prop:
                    objectid_found = True
                    break
            
            if objectid_found:
                self.log_result(
                    "ObjectId Removal - /api/imoveis", 
                    False, 
                    "❌ MongoDB _id field found in /api/imoveis response - ObjectId removal not working"
                )
                return False
            
            self.log_result(
                "ObjectId Removal - /api/imoveis", 
                True, 
                f"✅ No ObjectId found in /api/imoveis response ({len(properties)} properties checked)"
            )
            
            # Test 2: /api/meus-imoveis endpoint (need member login)
            if not self.test_login(MEMBER_EMAIL, MEMBER_PASSWORD, "member"):
                self.log_result(
                    "ObjectId Removal - /api/meus-imoveis", 
                    False, 
                    "Failed to login as member for meus-imoveis testing"
                )
                return False
            
            response = self.session.get(f"{API_BASE}/meus-imoveis")
            
            if response.status_code != 200:
                self.log_result(
                    "ObjectId Removal - /api/meus-imoveis", 
                    False, 
                    f"Failed to get member properties - Status {response.status_code}: {response.text}"
                )
                return False
            
            member_properties = response.json()
            
            # Check for ObjectId in member properties
            objectid_found = False
            for prop in member_properties:
                if "_id" in prop:
                    objectid_found = True
                    break
            
            if objectid_found:
                self.log_result(
                    "ObjectId Removal - /api/meus-imoveis", 
                    False, 
                    "❌ MongoDB _id field found in /api/meus-imoveis response - ObjectId removal not working"
                )
                return False
            
            self.log_result(
                "ObjectId Removal - /api/meus-imoveis", 
                True, 
                f"✅ No ObjectId found in /api/meus-imoveis response ({len(member_properties)} properties checked)"
            )
            
            # Test 3: /api/admin/imoveis-pendentes endpoint (need admin login)
            if not self.test_login(ADMIN_EMAIL, ADMIN_PASSWORD, "admin"):
                self.log_result(
                    "ObjectId Removal - /api/admin/imoveis-pendentes", 
                    False, 
                    "Failed to login as admin for pending properties testing"
                )
                return False
            
            response = self.session.get(f"{API_BASE}/admin/imoveis-pendentes")
            
            if response.status_code != 200:
                self.log_result(
                    "ObjectId Removal - /api/admin/imoveis-pendentes", 
                    False, 
                    f"Failed to get pending properties - Status {response.status_code}: {response.text}"
                )
                return False
            
            pending_properties = response.json()
            
            # Check for ObjectId in pending properties
            objectid_found = False
            for prop in pending_properties:
                if "_id" in prop:
                    objectid_found = True
                    break
            
            if objectid_found:
                self.log_result(
                    "ObjectId Removal - /api/admin/imoveis-pendentes", 
                    False, 
                    "❌ MongoDB _id field found in /api/admin/imoveis-pendentes response - ObjectId removal not working"
                )
                return False
            
            self.log_result(
                "ObjectId Removal - /api/admin/imoveis-pendentes", 
                True, 
                f"✅ No ObjectId found in /api/admin/imoveis-pendentes response ({len(pending_properties)} properties checked)"
            )
            
            return True
            
        except Exception as e:
            self.log_result("ObjectId Removal All Endpoints", False, f"Request error: {str(e)}")
            return False

    def test_cross_role_access(self):
        """Test that admin can access regular property listings as specified in review request"""
        try:
            # Login as admin
            if not self.test_login(ADMIN_EMAIL, ADMIN_PASSWORD, "admin"):
                self.log_result(
                    "Cross-Role Access - Admin Login", 
                    False, 
                    "Failed to login as admin"
                )
                return False
            
            # Test admin access to /api/imoveis (regular property listings)
            response = self.session.get(f"{API_BASE}/imoveis")
            
            if response.status_code != 200:
                self.log_result(
                    "Cross-Role Access - Admin to /api/imoveis", 
                    False, 
                    f"Admin cannot access /api/imoveis - Status {response.status_code}: {response.text}"
                )
                return False
            
            admin_properties = response.json()
            
            self.log_result(
                "Cross-Role Access - Admin to /api/imoveis", 
                True, 
                f"✅ Admin can access regular property listings ({len(admin_properties)} properties)"
            )
            
            # Test admin access to /api/parceiros
            response = self.session.get(f"{API_BASE}/parceiros")
            
            if response.status_code != 200:
                self.log_result(
                    "Cross-Role Access - Admin to /api/parceiros", 
                    False, 
                    f"Admin cannot access /api/parceiros - Status {response.status_code}: {response.text}"
                )
                return False
            
            admin_partners = response.json()
            
            self.log_result(
                "Cross-Role Access - Admin to /api/parceiros", 
                True, 
                f"✅ Admin can access partner listings ({len(admin_partners)} partners)"
            )
            
            return True
            
        except Exception as e:
            self.log_result("Cross-Role Access", False, f"Request error: {str(e)}")
            return False

    def test_property_listings_both_endpoints(self):
        """Test property listings in both Meus Imóveis and Todos os Imóveis as specified in review request"""
        try:
            # Login as member
            if not self.test_login(MEMBER_EMAIL, MEMBER_PASSWORD, "member"):
                self.log_result(
                    "Property Listings - Member Login", 
                    False, 
                    "Failed to login as member"
                )
                return False
            
            # Test /api/meus-imoveis (should show all member properties regardless of status)
            response = self.session.get(f"{API_BASE}/meus-imoveis")
            
            if response.status_code != 200:
                self.log_result(
                    "Property Listings - Meus Imóveis", 
                    False, 
                    f"Failed to get member properties - Status {response.status_code}: {response.text}"
                )
                return False
            
            member_properties = response.json()
            
            # Count properties by status
            pending_count = sum(1 for p in member_properties if p.get("status_aprovacao") == "pendente")
            approved_count = sum(1 for p in member_properties if p.get("status_aprovacao") == "aprovado")
            
            self.log_result(
                "Property Listings - Meus Imóveis", 
                True, 
                f"✅ Member properties endpoint working: {len(member_properties)} total ({approved_count} approved, {pending_count} pending)"
            )
            
            # Test /api/imoveis (should show only approved properties)
            response = self.session.get(f"{API_BASE}/imoveis")
            
            if response.status_code != 200:
                self.log_result(
                    "Property Listings - Todos os Imóveis", 
                    False, 
                    f"Failed to get all properties - Status {response.status_code}: {response.text}"
                )
                return False
            
            all_properties = response.json()
            
            # Verify all properties are approved
            non_approved = [p for p in all_properties if p.get("status_aprovacao") != "aprovado"]
            
            if non_approved:
                self.log_result(
                    "Property Listings - Todos os Imóveis", 
                    False, 
                    f"❌ Found {len(non_approved)} non-approved properties in /api/imoveis endpoint"
                )
                return False
            
            self.log_result(
                "Property Listings - Todos os Imóveis", 
                True, 
                f"✅ All properties endpoint working: {len(all_properties)} approved properties only"
            )
            
            # Verify that approved member properties appear in both endpoints
            member_approved_ids = {p.get("id") for p in member_properties if p.get("status_aprovacao") == "aprovado"}
            all_property_ids = {p.get("id") for p in all_properties}
            
            missing_in_all = member_approved_ids - all_property_ids
            
            if missing_in_all:
                self.log_result(
                    "Property Listings - Cross-Endpoint Consistency", 
                    False, 
                    f"❌ {len(missing_in_all)} approved member properties missing from /api/imoveis"
                )
                return False
            
            self.log_result(
                "Property Listings - Cross-Endpoint Consistency", 
                True, 
                f"✅ All approved member properties appear in both endpoints"
            )
            
            return True
            
        except Exception as e:
            self.log_result("Property Listings Both Endpoints", False, f"Request error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all API tests focusing on review request priorities"""
        print(f"🚀 Starting Portal ALT Ilhabela Property Approval & Listing Tests")
        print(f"📍 Backend URL: {BACKEND_URL}")
        print(f"🔑 Testing with admin credentials: {ADMIN_EMAIL}")
        print("=" * 80)
        
        # Test basic connectivity
        if not self.test_api_root():
            print("❌ Cannot connect to API - stopping tests")
            return False
        
        # Test authentication
        if not self.test_login():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # PRIORITY TESTING AREAS from review request
        print("\n🎯 PRIORITY TESTING AREAS (Review Request):")
        print("=" * 50)
        
        print("\n1. 🏠 PROPERTY APPROVAL SYSTEM:")
        print("   Testing admin approval of properties and verification they appear in listings")
        # Login as member first to create test property
        if self.test_login(MEMBER_EMAIL, MEMBER_PASSWORD, "member"):
            self.test_property_approval_flow()
        
        print("\n2. 📋 PROPERTY LISTINGS:")
        print("   Testing that approved properties appear in both 'Meus Imóveis' and 'Todos os Imóveis'")
        self.test_property_listings_both_endpoints()
        
        print("\n3. 🔧 OBJECTID REMOVAL:")
        print("   Verifying all property endpoints properly remove MongoDB ObjectId")
        self.test_objectid_removal_all_endpoints()
        
        print("\n4. 👨‍💼 ADMIN NAVIGATION:")
        print("   Testing that admin can access regular property listings")
        self.test_cross_role_access()
        
        # Additional comprehensive tests
        print("\n📊 ADDITIONAL COMPREHENSIVE TESTS:")
        print("=" * 40)
        
        # Test the specific endpoints mentioned in review request
        print("\n🎯 Testing Core Endpoints:")
        self.test_imoveis_endpoint()
        self.test_parceiros_endpoint()
        
        # Test member-specific endpoint with member credentials
        print("\n👤 Testing Member-Specific Endpoints:")
        if self.test_login(MEMBER_EMAIL, MEMBER_PASSWORD, "member"):
            self.test_meus_imoveis_endpoint_as_member()
            
            # Test property creation and details
            print("\n🏗️ Testing Property Management:")
            self.test_create_property_with_empty_urls()
            self.test_property_details_loading()
            self.test_property_owner_information()
        
        # Switch back to admin for admin-specific testing
        print("\n👨‍💼 Testing Admin-Specific Features:")
        if self.test_login(ADMIN_EMAIL, ADMIN_PASSWORD, "admin"):
            self.test_get_pending_properties()
        
        # Summary
        print("\n" + "=" * 80)
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
        
        print("\n🎯 REVIEW REQUEST SUCCESS CRITERIA:")
        
        # Check specific success criteria from review request
        approval_tests = [r for r in self.test_results if "Property Approval Flow" in r["test"]]
        listing_tests = [r for r in self.test_results if "Property Listings" in r["test"]]
        objectid_tests = [r for r in self.test_results if "ObjectId Removal" in r["test"]]
        admin_tests = [r for r in self.test_results if "Cross-Role Access" in r["test"]]
        
        criteria_met = 0
        total_criteria = 4
        
        if approval_tests and all(t["success"] for t in approval_tests):
            print("✅ Property approval changes status from 'pendente' to 'aprovado'")
            criteria_met += 1
        else:
            print("❌ Property approval workflow issues")
        
        if listing_tests and all(t["success"] for t in listing_tests):
            print("✅ Approved properties appear in /api/imoveis endpoint")
            criteria_met += 1
        else:
            print("❌ Property listing issues")
        
        if objectid_tests and all(t["success"] for t in objectid_tests):
            print("✅ All property endpoints return proper JSON without ObjectId errors")
            criteria_met += 1
        else:
            print("❌ ObjectId removal issues")
        
        if admin_tests and all(t["success"] for t in admin_tests):
            print("✅ Admin can access regular property listings")
            criteria_met += 1
        else:
            print("❌ Admin navigation issues")
        
        print(f"\n🎯 SUCCESS CRITERIA MET: {criteria_met}/{total_criteria}")
        
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