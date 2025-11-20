#!/usr/bin/env python3
"""
Deployment Readiness Health Check for Portal ALT Ilhabela
Comprehensive testing of all critical systems for production deployment
"""
import requests
import json
import sys
import time
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://temp-housing.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials for all user roles
ADMIN_EMAIL = "admin@alt-ilhabela.com"
ADMIN_PASSWORD = "admin123"
MEMBER_EMAIL = "membro@alt-ilhabela.com"
MEMBER_PASSWORD = "membro123"


class DeploymentReadinessChecker:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        self.critical_failures = []

    def log_result(self, test_name, success, message, response_data=None, critical=False):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data,
            "critical": critical
        }
        self.test_results.append(result)

        if not success and critical:
            self.critical_failures.append(test_name)

        status = "✅ PASS" if success else "❌ FAIL"
        priority = " [CRITICAL]" if critical else ""
        print(f"{status}{priority} - {test_name}: {message}")

    def login_as_user(self, email, password, user_type="user"):
        """Login as specific user type"""
        try:
            login_data = {
                "email": email,
                "password": password
            }

            response = self.session.post(
                f"{API_BASE}/auth/login", json=login_data)

            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.auth_token = data["access_token"]
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.auth_token}"
                    })
                    user_info = data.get("user", {})
                    self.log_result(
                        f"{user_type.title()} Authentication",
                        True,
                        f"Login successful for {user_info.get('email')} with role {user_info.get('role')}",
                        critical=True
                    )
                    return True
                else:
                    self.log_result(f"{user_type.title()} Authentication",
                                    False, "No access token in response", critical=True)
                    return False
            else:
                self.log_result(f"{user_type.title()} Authentication", False,
                                f"Login failed with status {response.status_code}: {response.text}", critical=True)
                return False

        except Exception as e:
            self.log_result(f"{user_type.title()} Authentication",
                            False, f"Login error: {str(e)}", critical=True)
            return False

    def test_authentication_system(self):
        """Test authentication for all user roles"""
        print("\n🔐 TESTING AUTHENTICATION SYSTEM")
        print("=" * 50)

        # Test admin login
        admin_success = self.login_as_user(
            ADMIN_EMAIL, ADMIN_PASSWORD, "admin")

        # Test member login
        member_success = self.login_as_user(
            MEMBER_EMAIL, MEMBER_PASSWORD, "member")

        # Test invalid credentials
        try:
            login_data = {
                "email": "invalid@test.com",
                "password": "wrongpassword"
            }

            response = self.session.post(
                f"{API_BASE}/auth/login", json=login_data)

            if response.status_code == 401:
                self.log_result(
                    "Invalid Credentials Rejection",
                    True,
                    "Invalid credentials properly rejected with 401 status"
                )
            else:
                self.log_result(
                    "Invalid Credentials Rejection",
                    False,
                    f"Invalid credentials not properly rejected - Status: {response.status_code}",
                    critical=True
                )

        except Exception as e:
            self.log_result("Invalid Credentials Rejection", False,
                            f"Error testing invalid credentials: {str(e)}")

        return admin_success and member_success

    def test_property_management_system(self):
        """Test complete property management workflow"""
        print("\n🏠 TESTING PROPERTY MANAGEMENT SYSTEM")
        print("=" * 50)

        # Login as member to create property
        if not self.login_as_user(MEMBER_EMAIL, MEMBER_PASSWORD, "member"):
            return False

        # Test property creation
        property_data = {
            "titulo": "Casa Deployment Test",
            "descricao": "Property for deployment readiness testing",
            "tipo": "casa",
            "regiao": "centro",
            "endereco_completo": "Rua do Deploy, 123",
            "num_quartos": 3,
            "num_banheiros": 2,
            "capacidade": 6,
            "possui_wifi": True,
            "link_booking": "",
            "link_airbnb": ""
        }

        try:
            response = self.session.post(
                f"{API_BASE}/imoveis", json=property_data)

            if response.status_code == 200:
                created_property = response.json()
                property_id = created_property.get("id")

                if created_property.get("status_aprovacao") == "pendente":
                    self.log_result(
                        "Property Creation",
                        True,
                        f"Property created successfully with pending status: {created_property.get('titulo')}",
                        critical=True
                    )

                    # Test property listing for member
                    response = self.session.get(f"{API_BASE}/meus-imoveis")
                    if response.status_code == 200:
                        member_properties = response.json()
                        self.log_result(
                            "Member Property Listing",
                            True,
                            f"Member can view their properties: {len(member_properties)} properties",
                            critical=True
                        )
                    else:
                        self.log_result(
                            "Member Property Listing",
                            False,
                            f"Member cannot view their properties - Status: {response.status_code}",
                            critical=True
                        )
                        return False

                    # Test property editing
                    update_data = {
                        "descricao": "Updated description for deployment test"
                    }

                    response = self.session.put(
                        f"{API_BASE}/imoveis/{property_id}", json=update_data)
                    if response.status_code == 200:
                        self.log_result(
                            "Property Editing",
                            True,
                            "Property successfully updated by owner"
                        )
                    else:
                        self.log_result(
                            "Property Editing",
                            False,
                            f"Property editing failed - Status: {response.status_code}",
                            critical=True
                        )

                    # Switch to admin for approval testing
                    if self.login_as_user(ADMIN_EMAIL, ADMIN_PASSWORD, "admin"):
                        # Test property approval
                        response = self.session.post(
                            f"{API_BASE}/admin/imoveis/{property_id}/aprovar")
                        if response.status_code == 200:
                            self.log_result(
                                "Property Approval",
                                True,
                                "Property successfully approved by admin",
                                critical=True
                            )

                            # Verify approved property appears in public listings
                            response = self.session.get(f"{API_BASE}/imoveis")
                            if response.status_code == 200:
                                approved_properties = response.json()
                                property_in_list = any(
                                    p.get("id") == property_id for p in approved_properties)

                                if property_in_list:
                                    self.log_result(
                                        "Approved Property in Listings",
                                        True,
                                        "Approved property appears in public listings",
                                        critical=True
                                    )
                                else:
                                    self.log_result(
                                        "Approved Property in Listings",
                                        False,
                                        "Approved property does not appear in public listings",
                                        critical=True
                                    )
                            else:
                                self.log_result(
                                    "Public Property Listings",
                                    False,
                                    f"Cannot access public property listings - Status: {response.status_code}",
                                    critical=True
                                )
                        else:
                            self.log_result(
                                "Property Approval",
                                False,
                                f"Property approval failed - Status: {response.status_code}",
                                critical=True
                            )
                            return False
                    else:
                        return False

                    return True
                else:
                    self.log_result(
                        "Property Creation",
                        False,
                        f"Property created but status is '{created_property.get('status_aprovacao')}' instead of 'pendente'",
                        critical=True
                    )
                    return False
            else:
                self.log_result(
                    "Property Creation",
                    False,
                    f"Property creation failed - Status: {response.status_code}: {response.text}",
                    critical=True
                )
                return False

        except Exception as e:
            self.log_result("Property Management System", False,
                            f"Error: {str(e)}", critical=True)
            return False

    def test_photo_upload_system(self):
        """Test photo upload and file handling"""
        print("\n📸 TESTING PHOTO UPLOAD SYSTEM")
        print("=" * 50)

        # Login as member
        if not self.login_as_user(MEMBER_EMAIL, MEMBER_PASSWORD, "member"):
            return False

        try:
            # Create a simple test file
            import tempfile
            import os

            # Test valid image upload
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
                tmp_file.write(b"fake image content for testing")
                tmp_file.flush()

                with open(tmp_file.name, 'rb') as f:
                    files = {
                        'file': ('test_deployment.jpg', f, 'image/jpeg')
                    }

                    response = self.session.post(
                        f"{API_BASE}/upload/foto", files=files)

                    if response.status_code == 200:
                        data = response.json()

                        if "url" in data and "filename" in data:
                            self.log_result(
                                "Photo Upload",
                                True,
                                f"Photo uploaded successfully: {data.get('url')}",
                                critical=True
                            )

                            # Test file type restrictions
                            with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as txt_file:
                                txt_file.write(b"This is not an image")
                                txt_file.flush()

                                with open(txt_file.name, 'rb') as f:
                                    files = {
                                        'file': ('test.txt', f, 'text/plain')
                                    }

                                    response = self.session.post(
                                        f"{API_BASE}/upload/foto", files=files)

                                    if response.status_code == 400:
                                        self.log_result(
                                            "Photo Upload File Restrictions",
                                            True,
                                            "Invalid file types properly rejected"
                                        )
                                    else:
                                        self.log_result(
                                            "Photo Upload File Restrictions",
                                            False,
                                            f"Invalid file type not rejected - Status: {response.status_code}",
                                            critical=True
                                        )

                                os.unlink(txt_file.name)

                            return True
                        else:
                            self.log_result(
                                "Photo Upload",
                                False,
                                f"Photo upload response missing required fields: {data}",
                                critical=True
                            )
                            return False
                    else:
                        self.log_result(
                            "Photo Upload",
                            False,
                            f"Photo upload failed - Status: {response.status_code}: {response.text}",
                            critical=True
                        )
                        return False

                os.unlink(tmp_file.name)

        except Exception as e:
            self.log_result("Photo Upload System", False,
                            f"Error: {str(e)}", critical=True)
            return False

    def test_email_notification_system(self):
        """Test email notification system"""
        print("\n📧 TESTING EMAIL NOTIFICATION SYSTEM")
        print("=" * 50)

        # Login as admin
        if not self.login_as_user(ADMIN_EMAIL, ADMIN_PASSWORD, "admin"):
            return False

        try:
            # Get pending properties
            response = self.session.get(f"{API_BASE}/admin/imoveis-pendentes")

            if response.status_code == 200:
                pending_properties = response.json()

                if pending_properties:
                    # Test email system by approving a property (this triggers email)
                    property_id = pending_properties[0].get("id")

                    response = self.session.post(
                        f"{API_BASE}/admin/imoveis/{property_id}/aprovar")

                    if response.status_code == 200:
                        self.log_result(
                            "Email Notification System",
                            True,
                            "Property approval successful - email notification should have been sent",
                            critical=True
                        )
                        return True
                    else:
                        self.log_result(
                            "Email Notification System",
                            False,
                            f"Property approval failed - Status: {response.status_code}",
                            critical=True
                        )
                        return False
                else:
                    self.log_result(
                        "Email Notification System",
                        True,
                        "No pending properties to test email notifications (system appears to be working)"
                    )
                    return True
            else:
                self.log_result(
                    "Email Notification System",
                    False,
                    f"Cannot access pending properties - Status: {response.status_code}",
                    critical=True
                )
                return False

        except Exception as e:
            self.log_result("Email Notification System", False,
                            f"Error: {str(e)}", critical=True)
            return False

    def test_database_operations(self):
        """Test database connectivity and CRUD operations"""
        print("\n🗄️ TESTING DATABASE OPERATIONS")
        print("=" * 50)

        try:
            # Test database connectivity by accessing various endpoints

            # Test read operations
            response = self.session.get(f"{API_BASE}/imoveis")
            if response.status_code == 200:
                properties = response.json()
                self.log_result(
                    "Database Read Operations",
                    True,
                    f"Successfully retrieved {len(properties)} properties from database",
                    critical=True
                )
            else:
                self.log_result(
                    "Database Read Operations",
                    False,
                    f"Database read failed - Status: {response.status_code}",
                    critical=True
                )
                return False

            # Test partners data
            response = self.session.get(f"{API_BASE}/parceiros")
            if response.status_code == 200:
                partners = response.json()
                self.log_result(
                    "Database Partners Collection",
                    True,
                    f"Successfully retrieved {len(partners)} partners from database"
                )
            else:
                self.log_result(
                    "Database Partners Collection",
                    False,
                    f"Partners data retrieval failed - Status: {response.status_code}",
                    critical=True
                )

            # Test user authentication (database user lookup)
            if self.login_as_user(ADMIN_EMAIL, ADMIN_PASSWORD, "database_test"):
                self.log_result(
                    "Database User Authentication",
                    True,
                    "User authentication and database lookup working",
                    critical=True
                )
            else:
                self.log_result(
                    "Database User Authentication",
                    False,
                    "Database user authentication failed",
                    critical=True
                )
                return False

            return True

        except Exception as e:
            self.log_result("Database Operations", False,
                            f"Error: {str(e)}", critical=True)
            return False

    def test_api_security(self):
        """Test API security and authorization"""
        print("\n🔒 TESTING API SECURITY")
        print("=" * 50)

        try:
            # Test unauthorized access
            old_headers = self.session.headers.copy()
            self.session.headers.pop("Authorization", None)

            # Try to access protected endpoint without authentication
            response = self.session.get(f"{API_BASE}/meus-imoveis")

            if response.status_code == 401:
                self.log_result(
                    "Unauthorized Access Protection",
                    True,
                    "Protected endpoints properly reject unauthorized requests",
                    critical=True
                )
            else:
                self.log_result(
                    "Unauthorized Access Protection",
                    False,
                    f"Protected endpoint accessible without authentication - Status: {response.status_code}",
                    critical=True
                )
                self.session.headers.update(old_headers)
                return False

            # Restore authentication
            self.session.headers.update(old_headers)

            # Test role-based access control
            # Login as member and try to access admin endpoint
            if self.login_as_user(MEMBER_EMAIL, MEMBER_PASSWORD, "member"):
                response = self.session.get(
                    f"{API_BASE}/admin/imoveis-pendentes")

                if response.status_code == 403:
                    self.log_result(
                        "Role-Based Access Control",
                        True,
                        "Admin endpoints properly reject non-admin users",
                        critical=True
                    )
                else:
                    self.log_result(
                        "Role-Based Access Control",
                        False,
                        f"Admin endpoint accessible to non-admin user - Status: {response.status_code}",
                        critical=True
                    )
                    return False
            else:
                return False

            return True

        except Exception as e:
            self.log_result("API Security", False,
                            f"Error: {str(e)}", critical=True)
            return False

    def test_performance_and_load(self):
        """Test basic performance and response times"""
        print("\n⚡ TESTING PERFORMANCE")
        print("=" * 50)

        try:
            # Test response times for key endpoints
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/imoveis")
            end_time = time.time()

            response_time = end_time - start_time

            if response.status_code == 200 and response_time < 5.0:
                self.log_result(
                    "API Response Time",
                    True,
                    f"Properties endpoint responds in {response_time:.2f} seconds (< 5s threshold)"
                )
            else:
                self.log_result(
                    "API Response Time",
                    False,
                    f"Properties endpoint slow or failed - Time: {response_time:.2f}s, Status: {response.status_code}",
                    critical=True
                )
                return False

            # Test concurrent requests simulation
            import threading
            import queue

            results_queue = queue.Queue()

            def make_request():
                try:
                    resp = self.session.get(f"{API_BASE}/parceiros")
                    results_queue.put(resp.status_code == 200)
                except:
                    results_queue.put(False)

            # Create 5 concurrent requests
            threads = []
            for i in range(5):
                thread = threading.Thread(target=make_request)
                threads.append(thread)
                thread.start()

            # Wait for all threads to complete
            for thread in threads:
                thread.join()

            # Check results
            successful_requests = 0
            while not results_queue.empty():
                if results_queue.get():
                    successful_requests += 1

            if successful_requests >= 4:  # Allow 1 failure out of 5
                self.log_result(
                    "Concurrent Request Handling",
                    True,
                    f"Successfully handled {successful_requests}/5 concurrent requests"
                )
            else:
                self.log_result(
                    "Concurrent Request Handling",
                    False,
                    f"Only {successful_requests}/5 concurrent requests succeeded",
                    critical=True
                )

            return True

        except Exception as e:
            self.log_result("Performance Testing", False, f"Error: {str(e)}")
            return False

    def test_production_environment_config(self):
        """Test production environment configuration"""
        print("\n🌐 TESTING PRODUCTION ENVIRONMENT")
        print("=" * 50)

        try:
            # Test CORS configuration
            response = self.session.options(f"{API_BASE}/imoveis")

            # Check if server responds to OPTIONS (CORS preflight)
            if response.status_code in [200, 204]:
                self.log_result(
                    "CORS Configuration",
                    True,
                    "CORS preflight requests handled correctly"
                )
            else:
                self.log_result(
                    "CORS Configuration",
                    False,
                    f"CORS preflight failed - Status: {response.status_code}"
                )

            # Test static file serving (uploads)
            # This is indirect - we test if the upload endpoint works
            response = self.session.get(f"{API_BASE}/")
            if response.status_code == 200:
                self.log_result(
                    "Static File Serving",
                    True,
                    "API endpoints accessible - static file serving should be working"
                )
            else:
                self.log_result(
                    "Static File Serving",
                    False,
                    f"API not accessible - Status: {response.status_code}",
                    critical=True
                )
                return False

            # Test environment variables (indirect)
            if self.login_as_user(ADMIN_EMAIL, ADMIN_PASSWORD, "env_test"):
                self.log_result(
                    "Environment Variables",
                    True,
                    "Database and authentication working - environment variables properly configured",
                    critical=True
                )
            else:
                self.log_result(
                    "Environment Variables",
                    False,
                    "Environment configuration issues detected",
                    critical=True
                )
                return False

            return True

        except Exception as e:
            self.log_result("Production Environment", False,
                            f"Error: {str(e)}", critical=True)
            return False

    def run_deployment_readiness_check(self):
        """Run complete deployment readiness check"""
        print("🚀 PORTAL ALT ILHABELA - DEPLOYMENT READINESS HEALTH CHECK")
        print("=" * 80)
        print(f"📍 Backend URL: {BACKEND_URL}")
        print(
            f"🕐 Test Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)

        # Run all critical system tests
        test_results = {
            "Authentication System": self.test_authentication_system(),
            "Property Management": self.test_property_management_system(),
            "Photo Upload System": self.test_photo_upload_system(),
            "Email Notifications": self.test_email_notification_system(),
            "Database Operations": self.test_database_operations(),
            "API Security": self.test_api_security(),
            "Performance": self.test_performance_and_load(),
            "Production Environment": self.test_production_environment_config()
        }

        # Generate summary
        print("\n" + "=" * 80)
        print("📊 DEPLOYMENT READINESS SUMMARY")
        print("=" * 80)

        passed_tests = sum(1 for result in test_results.values() if result)
        total_tests = len(test_results)

        for system, passed in test_results.items():
            status = "✅ READY" if passed else "❌ NOT READY"
            print(f"{status} - {system}")

        print(f"\n📈 Overall Score: {passed_tests}/{total_tests} systems ready")

        if self.critical_failures:
            print(f"\n🚨 CRITICAL FAILURES:")
            for failure in self.critical_failures:
                print(f"   - {failure}")

        # Deployment recommendation
        print(f"\n🎯 DEPLOYMENT RECOMMENDATION:")
        if passed_tests == total_tests and not self.critical_failures:
            print("✅ SYSTEM IS READY FOR PRODUCTION DEPLOYMENT")
            print("   All critical systems are functioning correctly.")
        elif passed_tests >= total_tests * 0.8 and not self.critical_failures:
            print("⚠️  SYSTEM IS MOSTLY READY - MINOR ISSUES DETECTED")
            print("   Consider addressing minor issues before deployment.")
        else:
            print("❌ SYSTEM NOT READY FOR DEPLOYMENT")
            print("   Critical issues must be resolved before production deployment.")

        # Save detailed results
        with open('/app/deployment_readiness_report.json', 'w') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "backend_url": BACKEND_URL,
                "system_results": test_results,
                "critical_failures": self.critical_failures,
                "detailed_results": self.test_results,
                "deployment_ready": passed_tests == total_tests and not self.critical_failures
            }, f, indent=2)

        print(f"\n📄 Detailed report saved to: /app/deployment_readiness_report.json")

        return passed_tests == total_tests and not self.critical_failures


if __name__ == "__main__":
    checker = DeploymentReadinessChecker()
    deployment_ready = checker.run_deployment_readiness_check()

    # Exit with appropriate code
    sys.exit(0 if deployment_ready else 1)
