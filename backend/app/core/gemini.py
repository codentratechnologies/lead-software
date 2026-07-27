import httpx
from app.core.config import settings

class GenerativeModel:
    def __init__(self, model_name):
        self.model_name = model_name

    def generate_content(self, prompt):
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise Exception("GEMINI_API_KEY is not set")
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        
        with httpx.Client() as client:
            response = client.post(url, json=payload, timeout=60.0)
            response.raise_for_status()
            data = response.json()
            
            try:
                text = data["candidates"][0]["content"]["parts"][0]["text"]
            except (KeyError, IndexError):
                text = ""
                
            return MockResponse(text)

class MockResponse:
    def __init__(self, text):
        self.text = text

class GenAI:
    GenerativeModel = GenerativeModel
    
    @staticmethod
    def configure(*args, **kwargs):
        pass

genai = GenAI()
