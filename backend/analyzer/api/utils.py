import google.generativeai as genai
from django.conf import settings
import json


GEMINI_MODEL_NAME = getattr(settings, "GEMINI_MODEL_NAME", "gemini-flash-latest")
GEMINI_API_KEY = getattr(settings, "GEMINI_API_KEY", "")

if GEMINI_API_KEY:
  genai.configure(api_key=GEMINI_API_KEY)
  model = genai.GenerativeModel(GEMINI_MODEL_NAME)
else:
  model = None


def _extract_json_payload(text):
  if not text:
    return None

  cleaned = text.strip()

  if cleaned.startswith("```"):
    lines = cleaned.splitlines()
    if len(lines) >= 3:
      cleaned = "\n".join(lines[1:-1]).strip()

  try:
    return json.loads(cleaned)
  except json.JSONDecodeError:
    pass

  start = cleaned.find("{")
  end = cleaned.rfind("}")
  if start != -1 and end != -1 and end > start:
    candidate = cleaned[start:end + 1]
    try:
      return json.loads(candidate)
    except json.JSONDecodeError:
      return None

  return None

def analyze_resume(resume_text,job_description):
    if model is None:
      return {
        "error": "AI analysis is unavailable: Gemini API key is not configured.",
        "status_code": 503,
      }

    prompt = f"""
You are an expert ATS (Applicant Tracking System) and senior recruiter.

Analyze the resume carefully against the job description.

Be strict and realistic. Do NOT be overly positive.

Return ONLY valid JSON in this format:

{{
  "scores": {{
    "overall": number (0-100),
    "work_experience": number (0-100),
    "education": number (0-100),
    "skills": number (0-100),
    "formatting": number (0-100)
  }},
  "missing_skills": {{
    "critical": ["skills required in job but missing in resume"],
    "recommended": ["good-to-have but missing"]
  }},
  "suggestions": [
    {{
      "section": "section name",
      "issue": "specific problem",
      "fix": "clear actionable improvement with examples"
    }}
  ]
}}

Rules:
- Scores must reflect real ATS evaluation
- Skills must match job description keywords
- Suggestions must be SPECIFIC (no generic advice)
- Use bullet-like clarity in fixes
- Do NOT include explanations outside JSON

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}
"""
    try:
      response = model.generate_content(prompt, generation_config={"temperature": 0.3})
      text = response.text
    except Exception as exc:
      message = str(exc)
      lowered = message.lower()

      if "429" in lowered or "quota" in lowered or "rate limit" in lowered:
        return {
          "error": "Gemini quota limit reached. Please try again shortly.",
          "status_code": 429,
        }

      if "api key" in lowered or "permission" in lowered or "unauthorized" in lowered:
        return {
          "error": "Gemini authentication failed. Check your API key and permissions.",
          "status_code": 401,
        }

      if "not found" in lowered or "model" in lowered:
        return {
          "error": "Configured Gemini model is unavailable. Please verify model name.",
          "status_code": 503,
        }

      return {
        "error": "Failed to analyze resume with AI model. Please try again.",
        "status_code": 502,
      }

    payload = _extract_json_payload(text)

    if payload is None:
      return {
        "error": "AI model returned an invalid response format. Please retry.",
        "status_code": 502,
      }

    return payload