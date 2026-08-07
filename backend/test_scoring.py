import os
import json
from app.workers.lead_tasks import analyze_and_score_lead
from app.core.config import settings

print("GEMINI API KEY EXISTS:", bool(settings.GEMINI_API_KEY))

try:
    analysis = analyze_and_score_lead("Test Company", "We build software for businesses in Pune.")
    print(json.dumps(analysis, indent=2))
except Exception as e:
    print("FATAL:", e)
