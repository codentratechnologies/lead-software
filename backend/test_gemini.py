import sys
import os

# Add the app directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.workers.lead_tasks import extract_intent_and_search

query = "Find me 5 mid-sized manufacturing companies in Ahmedabad, Gujarat"
try:
    print("Testing Gemini intent extraction...")
    results = extract_intent_and_search(query)
    print("Results:", results)
except Exception as e:
    print("Error:", e)
