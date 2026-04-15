from django.contrib.auth.models import User
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from user_app.models import Profile


@override_settings(SECURE_SSL_REDIRECT=False)
class UserAppTests(APITestCase):
	def test_profile_is_auto_created_with_new_user(self):
		user = User.objects.create_user(username='signal-user', password='pass12345')

		self.assertTrue(Profile.objects.filter(user=user).exists())

	def test_register_api_creates_user_and_returns_tokens(self):
		payload = {
			'username': 'newuser',
			'password': 'Pass@12345',
			'password2': 'Pass@12345',
		}

		response = self.client.post('/api/user/register/', payload, format='json')

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(response.data.get('username'), 'newuser')
		self.assertIn('access', response.data)
		self.assertIn('refresh', response.data)
		self.assertTrue(User.objects.filter(username='newuser').exists())
		self.assertTrue(Profile.objects.filter(user__username='newuser').exists())

	def test_register_api_rejects_password_mismatch(self):
		payload = {
			'username': 'baduser',
			'password': 'Pass@12345',
			'password2': 'Different@12345',
		}

		response = self.client.post('/api/user/register/', payload, format='json')

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertFalse(User.objects.filter(username='baduser').exists())
