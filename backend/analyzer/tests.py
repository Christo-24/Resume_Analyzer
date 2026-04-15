from datetime import timedelta
from unittest.mock import Mock, patch

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from analyzer.models import AnalysisResult
from user_app.models import Profile


@override_settings(SECURE_SSL_REDIRECT=False)
class AnalyzerApiTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(username='alice', password='pass12345')
		self.client.force_authenticate(user=self.user)

	def test_usage_resets_when_last_used_is_previous_day(self):
		profile = self.user.profile
		Profile.objects.filter(pk=profile.pk).update(
			usage_count=3,
			last_used=timezone.now() - timedelta(days=1),
		)
		fresh_user = User.objects.get(pk=self.user.pk)
		self.client.force_authenticate(user=fresh_user)

		response = self.client.get('/api/usage/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		profile.refresh_from_db()
		self.assertEqual(profile.usage_count, 0)
		self.assertEqual(response.data['remaining'], 3)

	def test_analyze_requires_resume_and_job_description(self):
		response = self.client.post('/api/analyze/', {'job_description': 'Backend dev'})

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('error', response.data)

	def test_analyze_blocks_free_user_after_daily_limit(self):
		profile = self.user.profile
		profile.usage_count = 3
		profile.last_used = timezone.now()
		profile.save(update_fields=['usage_count', 'last_used'])

		resume = SimpleUploadedFile('resume.pdf', b'%PDF-1.4 test content', content_type='application/pdf')
		response = self.client.post(
			'/api/analyze/',
			{'resume': resume, 'job_description': 'Python role'},
			format='multipart',
		)

		self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
		self.assertEqual(response.data.get('error'), 'daily limit reached')

	@patch('analyzer.api.views.analyze_resume')
	@patch('analyzer.api.views.PdfReader')
	def test_analyze_success_saves_result_and_updates_usage(self, pdf_reader_mock, analyze_resume_mock):
		page = Mock()
		page.extract_text.return_value = 'Skilled Python developer with Django experience'
		pdf_reader_mock.return_value.pages = [page]
		analyze_resume_mock.return_value = {'scores': {'overall': 87}}

		resume = SimpleUploadedFile('resume.pdf', b'%PDF-1.4 test content', content_type='application/pdf')
		response = self.client.post(
			'/api/analyze/',
			{'resume': resume, 'job_description': 'Django engineer'},
			format='multipart',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data, {'scores': {'overall': 87}})
		self.assertEqual(AnalysisResult.objects.filter(user=self.user).count(), 1)

		profile = self.user.profile
		profile.refresh_from_db()
		self.assertEqual(profile.usage_count, 1)

	def test_history_returns_only_authenticated_users_results(self):
		other_user = User.objects.create_user(username='bob', password='pass12345')
		AnalysisResult.objects.create(user=self.user, job_description='Role A', result={'score': 70})
		AnalysisResult.objects.create(user=other_user, job_description='Role B', result={'score': 95})

		response = self.client.get('/api/analyze/history/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 1)
		self.assertEqual(response.data[0]['job_description'], 'Role A')


@override_settings(SECURE_SSL_REDIRECT=False)
class AnalyzerAuthTests(APITestCase):
	def test_usage_requires_authentication(self):
		response = self.client.get('/api/usage/')
		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
