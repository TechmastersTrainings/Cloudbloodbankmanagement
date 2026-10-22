from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from hospital.models import HospitalProfile
from blood.models import BloodStock

User = get_user_model()


class HospitalModelTest(TestCase):
    """Test HospitalProfile model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='hospital@example.com',
            password='hospass123',
            full_name='Hospital Admin',
            role='HOSPITAL'
        )
    
    def test_create_hospital_profile(self):
        hospital = HospitalProfile.objects.create(
            user=self.user,
            hospital_name='Test Hospital',
            registration_number='REG12345',
            contact_number='9876543210',
            address='123 Hospital Rd',
            city='Test City',
            state='Test State',
            pincode='123456'
        )
        self.assertEqual(hospital.hospital_name, 'Test Hospital')
        self.assertEqual(hospital.registration_number, 'REG12345')
        self.assertFalse(hospital.is_verified)
        self.assertEqual(str(hospital), 'Test Hospital (Test City)')
    
    def test_hospital_profile_unique_registration(self):
        HospitalProfile.objects.create(
            user=self.user,
            hospital_name='Hospital 1',
            registration_number='REG123',
            contact_number='9876543210',
            address='123 Hospital Rd',
            city='Test City',
            state='Test State',
            pincode='123456'
        )
        
        # Create another user for second hospital
        user2 = User.objects.create_user(
            email='hospital2@example.com',
            password='hospass123',
            full_name='Hospital Admin 2',
            role='HOSPITAL'
        )
        
        with self.assertRaises(Exception):
            HospitalProfile.objects.create(
                user=user2,
                hospital_name='Hospital 2',
                registration_number='REG123',  # Duplicate
                contact_number='9876543211',
                address='456 Hospital Rd',
                city='Test City',
                state='Test State',
                pincode='123456'
            )


class BloodStockModelTest(TestCase):
    """Test BloodStock model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='hospital@example.com',
            password='hospass123',
            full_name='Hospital Admin',
            role='HOSPITAL'
        )
        self.hospital = HospitalProfile.objects.create(
            user=self.user,
            hospital_name='Test Hospital',
            registration_number='REG12345',
            contact_number='9876543210',
            address='123 Hospital Rd',
            city='Test City',
            state='Test State',
            pincode='123456'
        )
    
    def test_create_blood_stock(self):
        stock = BloodStock.objects.create(
            hospital=self.hospital,
            blood_group='O+',
            quantity=10
        )
        self.assertEqual(stock.hospital, self.hospital)
        self.assertEqual(stock.blood_group, 'O+')
        self.assertEqual(stock.quantity, 10)
        self.assertEqual(str(stock), 'Test Hospital - O+: 10 units')
    
    def test_unique_blood_group_per_hospital(self):
        BloodStock.objects.create(
            hospital=self.hospital,
            blood_group='A+',
            quantity=5
        )
        
        with self.assertRaises(Exception):
            BloodStock.objects.create(
                hospital=self.hospital,
                blood_group='A+',  # Duplicate blood group for same hospital
                quantity=3
            )
    
    def test_update_quantity(self):
        stock = BloodStock.objects.create(
            hospital=self.hospital,
            blood_group='B+',
            quantity=5
        )
        stock.quantity += 3
        stock.save()
        stock.refresh_from_db()
        self.assertEqual(stock.quantity, 8)


class HospitalAPITest(TestCase):
    """Test Hospital API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='hospital@example.com',
            password='hospass123',
            full_name='Hospital Admin',
            role='HOSPITAL'
        )
        self.hospital = HospitalProfile.objects.create(
            user=self.user,
            hospital_name='Test Hospital',
            registration_number='REG12345',
            contact_number='9876543210',
            address='123 Hospital Rd',
            city='Test City',
            state='Test State',
            pincode='123456',
            latitude=12.9716,
            longitude=77.5946,
            is_verified=True
        )
    
    def test_find_blood_public_endpoint(self):
        """Test public find-blood endpoint"""
        BloodStock.objects.create(
            hospital=self.hospital,
            blood_group='O+',
            quantity=10
        )
        
        response = self.client.get('/api/hospital/find-blood/', {
            'blood_group': 'O+',
            'lat': 12.9716,
            'lon': 77.5946
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['hospital'], 'Test Hospital')
        self.assertEqual(response.data[0]['stock_info']['blood_group'], 'O+')
        self.assertEqual(response.data[0]['stock_info']['available_units'], 10)
    
    def test_find_blood_requires_blood_group(self):
        response = self.client.get('/api/hospital/find-blood/', {
            'lat': 12.9716,
            'lon': 77.5946
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)
    
    def test_find_blood_no_results(self):
        response = self.client.get('/api/hospital/find-blood/', {
            'blood_group': 'AB-',
            'lat': 12.9716,
            'lon': 77.5946
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
    
    def test_find_blood_distance_sorting(self):
        """Test that results are sorted by distance"""
        # Create second hospital farther away
        user2 = User.objects.create_user(
            email='hospital2@example.com',
            password='hospass123',
            full_name='Hospital Admin 2',
            role='HOSPITAL'
        )
        hospital2 = HospitalProfile.objects.create(
            user=user2,
            hospital_name='Far Hospital',
            registration_number='REG12346',
            contact_number='9876543211',
            address='456 Far Rd',
            city='Far City',
            state='Test State',
            pincode='123457',
            latitude=13.0827,  # Chennai - farther from Bangalore
            longitude=80.2707,
            is_verified=True
        )
        
        BloodStock.objects.create(hospital=self.hospital, blood_group='O+', quantity=10)
        BloodStock.objects.create(hospital=hospital2, blood_group='O+', quantity=5)
        
        response = self.client.get('/api/hospital/find-blood/', {
            'blood_group': 'O+',
            'lat': 12.9716,  # Bangalore coordinates
            'lon': 77.5946
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        # First result should be the closer hospital (Bangalore)
        self.assertEqual(response.data[0]['hospital'], 'Test Hospital')
        self.assertLess(response.data[0]['distance_km'], response.data[1]['distance_km'])


class HospitalAuthAPITest(TestCase):
    """Test authenticated Hospital API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='hospital@example.com',
            password='hospass123',
            full_name='Hospital Admin',
            role='HOSPITAL'
        )
        self.hospital = HospitalProfile.objects.create(
            user=self.user,
            hospital_name='Test Hospital',
            registration_number='REG12345',
            contact_number='9876543210',
            address='123 Hospital Rd',
            city='Test City',
            state='Test State',
            pincode='123456'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_hospital_profile_get(self):
        response = self.client.get('/api/hospital/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['hospital_name'], 'Test Hospital')
        self.assertEqual(response.data['email'], 'hospital@example.com')
    
    def test_hospital_profile_update(self):
        response = self.client.patch('/api/hospital/profile/', {
            'hospital_name': 'Updated Hospital Name',
            'contact_number': '9999999999'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['hospital_name'], 'Updated Hospital Name')
        self.assertEqual(response.data['contact_number'], '9999999999')
    
    def test_blood_stock_crud(self):
        # Create
        response = self.client.post('/api/blood/stock/', {
            'blood_group': 'A+',
            'quantity': 15
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['quantity'], 15)
        
        stock_id = response.data['id']
        
        # List
        response = self.client.get('/api/blood/stock/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
        # Update
        response = self.client.patch(f'/api/blood/stock/{stock_id}/', {
            'quantity': 20
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['quantity'], 20)