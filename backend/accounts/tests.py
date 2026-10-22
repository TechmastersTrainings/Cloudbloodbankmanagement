from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User

User = get_user_model()


class UserModelTest(TestCase):
    """Test User model creation and methods"""
    
    def test_create_user(self):
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            full_name='Test User',
            role='RECEIVER'
        )
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.full_name, 'Test User')
        self.assertEqual(user.role, 'RECEIVER')
        self.assertTrue(user.check_password('testpass123'))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
    
    def test_create_superuser(self):
        admin = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123',
            full_name='Admin User'
        )
        self.assertEqual(admin.email, 'admin@example.com')
        self.assertEqual(admin.role, 'ADMIN')
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_active)
    
    def test_create_user_without_email_raises_error(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email='', password='testpass123', full_name='Test')
    
    def test_create_user_without_full_name_raises_error(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email='test@example.com', password='testpass123', full_name='')
    
    def test_user_str_representation(self):
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            full_name='Test User',
            role='DONOR'
        )
        self.assertEqual(str(user), 'test@example.com (DONOR)')


class AccountsAPITest(TestCase):
    """Test Accounts API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/accounts/register/'
        self.login_url = '/api/accounts/login/'
        self.stats_url = '/api/accounts/stats/'
    
    def test_register_user(self):
        data = {
            'email': 'newuser@example.com',
            'password': 'testpass123',
            'full_name': 'New User',
            'role': 'DONOR',
            'phone': '1234567890',
            'address': '123 Test St'
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertTrue(User.objects.filter(email='newuser@example.com').exists())
    
    def test_register_invalid_role(self):
        data = {
            'email': 'invalid@example.com',
            'password': 'testpass123',
            'full_name': 'Invalid User',
            'role': 'INVALID_ROLE'
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_login_user(self):
        user = User.objects.create_user(
            email='login@example.com',
            password='loginpass123',
            full_name='Login User',
            role='RECEIVER'
        )
        data = {
            'email': 'login@example.com',
            'password': 'loginpass123'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'login@example.com')
        self.assertEqual(response.data['user']['role'], 'RECEIVER')
    
    def test_login_invalid_credentials(self):
        data = {
            'email': 'nonexistent@example.com',
            'password': 'wrongpass'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_system_stats_public(self):
        response = self.client.get(self.stats_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('donors', response.data)
        self.assertIn('hospitals', response.data)
        self.assertIn('receivers', response.data)
        self.assertIsInstance(response.data['donors'], int)
        self.assertIsInstance(response.data['hospitals'], int)
        self.assertIsInstance(response.data['receivers'], int)


class TokenRefreshTest(TestCase):
    """Test JWT token refresh"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='token@example.com',
            password='tokenpass123',
            full_name='Token User',
            role='DONOR'
        )
        self.refresh_url = '/api/accounts/token/refresh/'
    
    def test_token_refresh(self):
        # First login to get tokens
        login_response = self.client.post('/api/accounts/login/', {
            'email': 'token@example.com',
            'password': 'tokenpass123'
        }, format='json')
        
        refresh_token = login_response.data['refresh']
        
        # Use refresh token to get new access token
        response = self.client.post(self.refresh_url, {'refresh': refresh_token}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
    
    def test_invalid_refresh_token(self):
        response = self.client.post(self.refresh_url, {'refresh': 'invalid_token'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)