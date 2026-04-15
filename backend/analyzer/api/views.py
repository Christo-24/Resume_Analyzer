from .utils import analyze_resume
from analyzer.models import AnalysisResult
from user_app.models import Profile

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from PyPDF2 import PdfReader
from PyPDF2.errors import PdfReadError

from django.utils import timezone

import razorpay
import hmac
import hashlib

from django.conf import settings


client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)
    today = timezone.localdate()

    if profile.last_used is None or profile.last_used.date() != today:
        profile.usage_count = 0

    if not profile.is_pro and profile.usage_count >= 3:
        return Response({"error": "daily limit reached"}, status=429)

    resume=request.FILES.get('resume')
    job_description=request.data.get('job_description')

    if not resume or not job_description:
        return Response({"error":"Both resume and job_description are required"},status=400)
    
    try:
        reader = PdfReader(resume)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
    except PdfReadError:
        return Response({"error": "Invalid or corrupted PDF file"}, status=400)
    except Exception:
        return Response({"error": "Could not read resume PDF"}, status=400)

    text=text.replace("\n"," ")
    text=" ".join(text.split())

    if not text:
        return Response({"error": "No readable text found in resume PDF"}, status=400)

    result = analyze_resume(text,job_description)
    if isinstance(result, dict) and result.get("error"):
        status_code = result.get("status_code", 502)
        payload = {"error": result.get("error", "Analysis failed")}
        return Response(payload, status=status_code)

    profile.usage_count += 1
    profile.last_used = timezone.now()
    profile.save(update_fields=["usage_count", "last_used"])
    AnalysisResult.objects.create(user=request.user, job_description=job_description, result=result)
    return Response(result if isinstance(result, dict) else {"result": result})

class HistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        history = AnalysisResult.objects.filter(user=request.user).order_by('-created_at')
        data = [{"result": h.result, "job_description": h.job_description, "created_at": h.created_at} for h in history]
        return Response(data)



class UsageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        today = timezone.localdate()

        if profile.last_used is None or profile.last_used.date() != today:
            profile.usage_count = 0
            profile.last_used = timezone.now()
            profile.save(update_fields=["usage_count", "last_used"])

        remaining = 999 if profile.is_pro else max(0, 3 - profile.usage_count)
        return Response(
            {
                "is_pro": profile.is_pro,
                "usage_count": profile.usage_count,
                "remaining": remaining,
            }
        )
    
class UpgradeproView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        if profile.is_pro:
            remaining = 999
            return Response(
                {
                    "message": "Already a pro user",
                    "is_pro": True,
                    "usage_count": profile.usage_count,
                    "remaining": remaining,
                },
                status=400,
            )
        
        profile.is_pro = True
        profile.save(update_fields=["is_pro"])
        return Response(
            {
                "message": "Upgraded to pro successfully",
                "is_pro": True,
                "usage_count": profile.usage_count,
                "remaining": 999,
            }
        )
    
class CreateOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_data = {
            "amount": 50000,
            "currency": "INR",
            "payment_capture": 1
        }
        order=client.order.create(order_data)
        return Response({
            "order_id": order.get("id"),
            "amount": order_data["amount"],
            "key": settings.RAZORPAY_KEY_ID
        })
    
class VerifyPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        razorpay_payment_id = request.data.get("razorpay_payment_id")
        razorpay_order_id = request.data.get("razorpay_order_id")
        razorpay_signature = request.data.get("razorpay_signature")

        if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature]):
            return Response({"error": "Missing payment details"}, status=400)

        generated_signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
            hashlib.sha256
        ).hexdigest()

        if generated_signature != razorpay_signature:
            return Response({"error": "Invalid payment signature"}, status=400)

        profile = request.user.profile
        profile.is_pro = True
        profile.save(update_fields=["is_pro"])

        return Response({"message": "Payment verified and account upgraded to pro"})