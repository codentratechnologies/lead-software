import json
from celery import shared_task
import google.generativeai as genai
from bs4 import BeautifulSoup
import httpx
from playwright.sync_api import sync_playwright

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.campaign import Campaign
from app.models.company import Company
from app.models.lead import Lead

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

def extract_intent_and_search(query: str):
    """Uses Gemini to parse the user query and generate a list of companies to target."""
    prompt = f"""
    You are an AI Lead Generation Assistant.
    A user has given this command: "{query}"
    
    Extract the intent and return a JSON list of 3-5 real companies that match this description.
    Make sure they are real companies with real websites so we can scrape them.
    
    Format:
    [
        {{
            "name": "Company Name",
            "website": "https://www.example.com",
            "industry": "Software",
            "location": "Pune"
        }}
    ]
    Return ONLY valid JSON.
    """
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(prompt)
    try:
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3].strip()
        return json.loads(raw_text)
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        return []

def scrape_website(url: str) -> str:
    """Scrapes a website and returns its text content."""
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, timeout=15000)
            content = page.content()
            browser.close()
            
            soup = BeautifulSoup(content, "html.parser")
            return soup.get_text(separator=" ", strip=True)[:5000] # Limit tokens
    except Exception as e:
        print(f"Scraping error for {url}: {e}")
        return ""

def analyze_and_score_lead(company_name: str, website_text: str):
    """Analyzes website text using Gemini to find problems and generate a score."""
    prompt = f"""
    Analyze this website content for {company_name}:
    
    CONTENT:
    {website_text[:3000]}
    
    Identify:
    1. Potential problems or missing features (e.g. outdated, no booking system, no CRM).
    2. Recommended software solutions we can sell them.
    3. A lead score from 0 to 100 indicating how likely they need our IT services.
    
    Return ONLY valid JSON:
    {{
        "problems": "Missing features X, Y",
        "recommendation": "ERP + Custom App",
        "score": 85
    }}
    """
    model = genai.GenerativeModel('gemini-1.5-flash')
    try:
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3].strip()
        return json.loads(raw_text)
    except:
        return {"problems": "Could not analyze", "recommendation": "General IT Consulting", "score": 50}

@shared_task
def process_lead_campaign(campaign_id: int):
    db = SessionLocal()
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        db.close()
        return
        
    print(f"Starting campaign: {campaign.name}")
    companies_data = extract_intent_and_search(campaign.search_query)
    
    for comp_data in companies_data:
        # Create Company
        company = Company(
            name=comp_data.get("name"),
            website=comp_data.get("website"),
            industry=comp_data.get("industry")
        )
        db.add(company)
        db.commit()
        db.refresh(company)
        
        # Scrape and Analyze
        website_text = scrape_website(company.website) if company.website else ""
        analysis = analyze_and_score_lead(company.name, website_text)
        
        # Create Lead
        lead = Lead(
            company_id=company.id,
            campaign_id=campaign.id,
            problems_identified=analysis.get("problems"),
            recommended_solution=analysis.get("recommendation"),
            lead_score=analysis.get("score")
        )
        db.add(lead)
        db.commit()
        
    campaign.status = "Completed"
    db.commit()
    db.close()
    print("Campaign finished.")
