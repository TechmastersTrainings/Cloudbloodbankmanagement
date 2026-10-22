from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status
from hospital.models import HospitalProfile
from donor.models import DonorProfile
from receiver.models import ReceiverProfile
from blood.models import BloodStock, BloodRequest, DonationRecord, DonationAppointment

User = get_user_model()


class BloodRequestModelTest(TestCase):
    """Test BloodRequest model"""
    
    def setUp(self):
        self.hospital_user = User.objects.create_user(
            email='hospital@example.com',
            password='hospass123',
            full_name='Hospital Admin',
            role='HOSPITAL'
        )
        self.hospital = HospitalProfile.objects.create(
            user=self.hospital_user,
            hospital_name='Test Hospital',
            registration_number='REG12345',
            contact_number='9876543210',
            address='123 Hospital Rd',
            city='Test City',
            state='Test State',
            pincode='123456'
        )
        
        self.receiver_user = User.objects.create_user(
            email='receiver@example.com',
            password='recpass123',
            full_name='Receiver User',
            role='RECEIVER'
        )
        self.receiver = ReceiverProfile.objects.create(
            user=self.receiver_user,
            full_name='Receiver User',
            date_of_birth='1990-01-01',
            gender='M',
            blood_group='O+',
            contact_phone='9876543210',
            address='123 Receiver St',
            city='Test City',
            state='Test State',
            pincode='123456'
        )
    
    def test_create_blood_request(self):
        request = BloodRequest.objects.create(
            receiver=self.receiver,
            hospital=self.hospital,
            blood_group='O+',
            quantity_requested=2,
            urgency_level='High'
        )
        self.assertEqual(request.receiver, self.receiver)
        self.assertEqual(request.hospital, self.hospital)
        self.assertEqual(request.blood_group, 'O+')
        self.assertEqual(request.quantity_requested, 2)
        self.assertEqual(request.urgency_level, 'High')
        self.assertEqual(request.status, 'Pending')
        self.assertIn('Request', str(request))
    
    def test_blood_request_approval_workflow(self):
        # Create stock first
        BloodStock.objects.create(hospital=self.hospital, blood_group='O+', quantity=10)
        
        request = BloodRequest.objects.create(
            receiver=self.receiver,
            hospital=self.hospital,
            blood_group='O+',
            quantity_requested=2,
            urgency_level='High'
        )
        
        # Approve request
        request.status = 'Approved'
        request.save()
        
        # Check stock was decremented (this would happen in view, not model)
        stock = BloodStock.objects.get(hospital=self.hospital, blood_group='O+')
        self.assertEqual(stock.quantity, 10)  # Model doesn't auto-decrement
        
        # Complete request
        request.status = 'Completed'
        request.save()
        self.assertEqual(request.status, 'Completed')


class DonationRecordModelTest(TestCase):
    """Test DonationRecord model"""
    
    def setUp(self):
        self.hospital_user = User.objects.create_user(
            email='hospital@example.com',
            password='hospass123',
            full_name='Hospital Admin',
            role='HOSPITAL'
        )
        self.hospital = HospitalProfile.objects.create(
            user=self.hospital_user,
            hospital_name='Test Hospital',
            registration_number='REG12345',
            contact_number='9876543210',
            address='123 Hospital Rd',
            city='Test City',
            state='Test State',
            pincode='123456'
        )
        
        self.donor_user = User.objects.create_user(
            email='donor@example.com',
            password='donorpass123',
            full_name='Donor User',
            role='DONOR'
        )
        self.donor = DonorProfile.objects.create(
            user=self.donor_user,
            full_name='Donor User',
            date_of_birth='1990-01-01',
            gender='M',
            blood_group='O+',
            contact_phone='9876543210',
            address='123 Donor St',
            city='Test City',
            state='Test State',
            pincode='123456'
        )
    
    def test_create_donation_record(self):
        donation = DonationRecord.objects.create(
            donor=self.donor,
            hospital=self.hospital,
            blood_group='O+',
            quantity=1
        )
        self.assertEqual(donation.donor, self.donor)
        self.assertEqual(donation.hospital, self.hospital)
        self.assertEqual(donation.blood_group, 'O+')
        self.assertEqual(donation.quantity, 1)
        self.assertFalse(donation.verified)
        self.assertIn('Donation', str(donation))
    
    def test_verified_donation(self):
        donation = DonationRecord.objects.create(
            donor=self.donor,
            hospital=self.hospital,
            blood_group='A+',
            quantity=2,
            verified=True
        )
        self.assertTrue(donation.verified)


class DonationAppointmentModelTest(TestCase):
    """Test DonationAppointment model"""
    
    def setUp(self):
        self.hospital_user = User.objects.create_user(
            email='hospital@example.com',
            password='hospass123',
            full_name='Hospital Admin',
            role='HOSPITAL'
        )
        self.hospital = HospitalProfile.objects.create(
            user=self.hospital_user,
            hospital_name='Test Hospital',
            registration_number='REG12345',
            contact_number='9876543210',
            address='123 Hospital Rd',
            city='Test City',
            state='Test State',
            pincode='123456'
        )
        
        self.donor_user = User.objects.create_user(
            email='donor@example.com',
            password='donorpass123',
            full_name='Donor User',
            role='DONOR'
        )
        self.donor = DonorProfile.objects.create(
            user=self.donor_user,
            full_name='Donor User',
            date_of_birth='1990-01-01',
            gender='M',
            blood_group='O+',
            contact_phone='9876543210',
            address='123 Donor St',
            city='Test City',
            state='Test State',
            pincode='123456'
        )
    
    def test_create_appointment(self):
        appointment = DonationAppointment.objects.create(
            donor=self.donor,
            hospital=self.hospital,
            blood_group='O+',
            appointment_date=timezone.now().date(),
            appointment_time='10:00:00',
            quantity_pints=1
        )
        self.assertEqual(appointment.status, 'Scheduled')
        self.assertEqual(appointment.quantity_pints, 1)
        self.assertIn(self.donor.full_name, str(appointment))
        self.assertIn(self.hospital.hospital_name, str(appointment))
    
    def test_appointment_completion_creates_record(self):
        """Test that completing appointment creates donation record (view logic)"""
        appointment = DonationAppointment.objects.create(
            donor=self.donor,
            hospital=self.hospital,
            blood_group='O+',
            appointment_date=timezone.now().date(),
            appointment_time='10:00:00',
            quantity_pints=1
        )
        
        # Simulate view logic: complete appointment
        appointment.status = 'Completed'
        appointment.save()
        
        # Note: DonationRecord creation is handled in the view (DonationAppointmentStatusUpdateView)
        # This test verifies the model allows status change
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, 'Completed')


class BloodAPITest(TestCase):
    """Test Blood API endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create hospital
        self.hospital_user = User.objects.create_user(
            email='hospital@example.com',
            password='hospass123',
            full_name='Hospital Admin',
            role='HOSPITAL'
        )
        self.hospital = HospitalProfile.objects.create(
            user=self.hospital_user,
            hospital_name='Test Hospital',
            registration_number='REG12345',
            contact_number='9876543210',
            address='123 Hospital Rd',
            city='Test City',
            state='Test State',
            pincode='123456',
            is_verified=True
        )
        
        # Create donor
        self.donor_user = User.objects.create_user(
            email='donor@example.com',
            password='donorpass123',
            full_name='Donor User',
            role='DONOR'
        )
        self.donor = DonorProfile.objects.create(
            user=self.donor_user,
            full_name='Donor User',
            date_of_birth='1990-01-01',
            gender='M',
            blood_group='O+',
            contact_phone='9876543210',
            address='123 Donor St',
            city='Test City',
            state='Test State',
            pincode='123456'
        )
        
        # Create receiver
        self.receiver_user = User.objects.create_user(
            email='receiver@example.com',
            password='recpass123',
            full_name='Receiver User',
            role='RECEIVER'
        )
        self.receiver = ReceiverProfile.objects.create(
            user=self.receiver_user,
            full_name='Receiver User',
            date_of_birth='1990-01-01',
            gender='F',
            blood_group='O+',
            contact_phone='9876543210',
            address='123 Receiver St',
            city='Test City',
            state='Test State',
            pincode='123456'
        )
    
    def test_receiver_create_blood_request(self):
        self.client.force_authenticate(user=self.receiver_user)
        
        response = self.client.post('/api/blood/request/', {
            'hospital': self.hospital.id,
            'blood_group': 'O+',
            'quantity_requested': 2,
            'urgency_level': 'High'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['blood_group'], 'O+')
        self.assertEqual(response.data['quantity_requested'], 2)
        self.assertEqual(response.data['status'], 'Pending')
    
    def test_hospital_approve_blood_request(self):
        # Create stock first
        BloodStock.objects.create(hospital=self.hospital, blood_group='O+', quantity=10)
        
        # Create request as receiver
        self.client.force_authenticate(user=self.receiver_user)
        create_response = self.client.post('/api/blood/request/', {
            'hospital': self.hospital.id,
            'blood_group': 'O+',
            'quantity_requested': 2,
            'urgency_level': 'High'
        }, format='json')
        request_id = create_response.data['id']
        
        # Approve as hospital
        self.client.force_authenticate(user=self.hospital_user)
        response = self.client.post(f'/api/blood/requests/{request_id}/action/', {
            'action': 'approve'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('approved', response.data['detail'].lower())
        
        # Check stock was decremented
        stock = BloodStock.objects.get(hospital=self.hospital, blood_group='O+')
        self.assertEqual(stock.quantity, 8)
    
    def test_hospital_reject_blood_request(self):
        # Create request
        self.client.force_authenticate(user=self.receiver_user)
        create_response = self.client.post('/api/blood/request/', {
            'hospital': self.hospital.id,
            'blood_group': 'O+',
            'quantity_requested': 2,
            'urgency_level': 'High'
        }, format='json')
        request_id = create_response.data['id']
        
        # Reject as hospital
        self.client.force_authenticate(user=self.hospital_user)
        response = self.client.post(f'/api/blood/requests/{request_id}/action/', {
            'action': 'reject'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('rejected', response.data['detail'].lower())
    
    def test_donor_create_appointment(self):
        self.client.force_authenticate(user=self.donor_user)
        future_date = (timezone.now().date() + timedelta(days=30)).isoformat()
        
        response = self.client.post('/api/blood/appointments/', {
            'hospital': self.hospital.id,
            'blood_group': 'O+',
            'appointment_date': future_date,
            'appointment_time': '10:00:00',
            'quantity_pints': 1
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'Scheduled')
        self.assertEqual(response.data['quantity_pints'], 1)
    
    def test_hospital_complete_appointment(self):
        # Create appointment as donor
        self.client.force_authenticate(user=self.donor_user)
        future_date = (timezone.now().date() + timedelta(days=30)).isoformat()
        create_response = self.client.post('/api/blood/appointments/', {
            'hospital': self.hospital.id,
            'blood_group': 'O+',
            'appointment_date': future_date,
            'appointment_time': '10:00:00',
            'quantity_pints': 1
        }, format='json')
        appointment_id = create_response.data['id']
        
        # Complete as hospital
        self.client.force_authenticate(user=self.hospital_user)
        response = self.client.patch(f'/api/blood/appointments/{appointment_id}/update/', {
            'status': 'Completed'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'Completed')
        
        # Check donation record created
        donation = DonationRecord.objects.filter(
            donor=self.donor,
            hospital=self.hospital
        ).first()
        self.assertIsNotNone(donation)
        self.assertTrue(donation.verified)