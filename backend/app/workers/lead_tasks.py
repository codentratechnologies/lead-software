import json
from celery import shared_task
from app.core.gemini import genai
from bs4 import BeautifulSoup
import httpx
# from playwright.sync_api import sync_playwright
from ddgs import DDGS
import time

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.campaign import Campaign
from app.models.company import Company
from app.models.lead import Lead

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

def parse_user_query(query: str):
    prompt = f"""
    Analyze the following lead generation query: "{query}"
    Extract the following details:
    1. 'niche': The specific type of business or industry (e.g., 'software companies', 'plumbers', 'dentists'). If not clear, default to 'companies'.
    2. 'location': The geographical location mentioned. If none, default to ''.
    3. 'count': The number of leads requested. If not specified, default to 10.
    
    Return ONLY valid JSON in this format:
    {{
        "niche": "software companies",
        "location": "Pune",
        "count": 10
    }}
    """
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3].strip()
        return json.loads(raw_text)
    except Exception as e:
        print(f"Error parsing query: {e}")
        return {"niche": query, "location": "", "count": 10}

def search_duckduckgo(niche: str, location: str, max_results_per_source: int = 5):
    results = []
    search_query = f"{niche} {location}".strip()
    
    # 1. Search general web
    try:
        web_results = DDGS().text(search_query, max_results=max_results_per_source)
        for r in web_results:
            results.append({"name": r.get("title", ""), "website": r.get("href", ""), "description": r.get("body", ""), "source": "web"})
    except Exception as e:
        print(f"Web search error: {e}")
        
    time.sleep(1) # Rate limit protection

    # 2. Search LinkedIn
    try:
        li_query = f"site:linkedin.com/company {search_query}"
        li_results = DDGS().text(li_query, max_results=max_results_per_source)
        for r in li_results:
            results.append({"name": r.get("title", ""), "website": r.get("href", ""), "description": r.get("body", ""), "source": "linkedin"})
    except Exception as e:
        print(f"LinkedIn search error: {e}")

    time.sleep(1)

    # 3. Search Instagram
    try:
        ig_query = f"site:instagram.com {search_query}"
        ig_results = DDGS().text(ig_query, max_results=max_results_per_source)
        for r in ig_results:
            results.append({"name": r.get("title", ""), "website": r.get("href", ""), "description": r.get("body", ""), "source": "instagram"})
    except Exception as e:
        print(f"Instagram search error: {e}")
        
    return results

def search_google_maps(niche: str, location: str, max_results_per_source: int = 5):
    # Google Maps scraping disabled because Playwright is blocked by Application Control policy
    print("Google Maps search skipped (Playwright disabled)")
    return []

def generate_ai_leads(niche: str, location: str, count: int = 2):
    prompt = f"""
    You are an AI Lead Generation Assistant.
    Generate {count} REAL companies matching '{niche}' in '{location}'.
    Return ONLY valid JSON format:
    [
      {{"name": "Company", "website": "https://example.com", "description": "AI generated recommendation", "source": "ai"}}
    ]
    """
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3].strip()
        return json.loads(raw_text)
    except Exception as e:
        print(f"Error generating AI leads: {e}")
        return []

def filter_best_leads(query: str, pool: list, count: int):
    if not pool:
        return []
    
    pool_data = [{"id": i, "name": p["name"], "description": p.get("description", "")[:200], "source": p["source"]} for i, p in enumerate(pool)]
    
    prompt = f"""
    User wants leads matching: "{query}"
    
    Here is a pool of companies found from various sources:
    {json.dumps(pool_data, indent=2)}
    
    Select up to {count} most relevant companies from this list. 
    CRITICAL REQUIREMENT: You MUST return a diverse mix of sources. Select at least one lead from EACH available source (maps, linkedin, instagram, web, ai) if a valid one exists. Do not pick all leads from the same source!
    Exclude directories (like Goodfirms, Justdial), job portals, or irrelevant results.
    Return ONLY a valid JSON list containing the exact IDs of the selected companies.
    Example: [0, 3, 5]
    """
    
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3].strip()
        selected_ids = json.loads(raw_text)
        
        filtered = []
        for pid in selected_ids:
            if 0 <= pid < len(pool):
                item = pool[pid]
                item["industry"] = "Various"
                item["location"] = "Unknown"
                filtered.append(item)
        return filtered
    except Exception as e:
        print(f"Error filtering leads: {e}")
        for item in pool[:count]:
            item["industry"] = "Various"
            item["location"] = "Unknown"
        return pool[:count]

def search_apollo(niche: str, location: str, max_results_per_source: int = 5):
    if not settings.APOLLO_API_KEY:
        print("Apollo search skipped (API key not configured)")
        return []
    # Stub for Apollo.io API integration
    # Typically would query Apollo's /v1/mixed_people/search with q_organization_domains or similar
    print(f"Searching Apollo for {niche} in {location}...")
    return []

def search_crunchbase(niche: str, location: str, max_results_per_source: int = 5):
    if not settings.CRUNCHBASE_API_KEY:
        print("Crunchbase search skipped (API key not configured)")
        return []
    # Stub for Crunchbase API integration
    print(f"Searching Crunchbase for {niche} in {location}...")
    return []

def search_reddit(niche: str, location: str, max_results_per_source: int = 5):
    if not settings.REDDIT_CLIENT_ID or not settings.REDDIT_CLIENT_SECRET:
        print("Reddit search skipped (API keys not configured)")
        return []
    results = []
    try:
        import praw
        reddit = praw.Reddit(
            client_id=settings.REDDIT_CLIENT_ID,
            client_secret=settings.REDDIT_CLIENT_SECRET,
            user_agent="Codentra Lead Generator v1.0"
        )
        search_query = f"{niche} {location}".strip()
        # Search across all subreddits
        for submission in reddit.subreddit("all").search(search_query, limit=max_results_per_source):
            results.append({
                "name": f"Reddit Post: {submission.title[:30]}", 
                "website": submission.url, 
                "description": submission.selftext[:200], 
                "source": "reddit"
            })
    except Exception as e:
        print(f"Reddit search error: {e}")
    return results

def search_yelp(niche: str, location: str, max_results_per_source: int = 5):
    if not settings.YELP_API_KEY:
        print("Yelp search skipped (API key not configured)")
        return []
    results = []
    try:
        headers = {"Authorization": f"Bearer {settings.YELP_API_KEY}"}
        params = {"term": niche, "location": location or "US", "limit": max_results_per_source}
        response = httpx.get("https://api.yelp.com/v3/businesses/search", headers=headers, params=params, timeout=10.0)
        if response.status_code == 200:
            for b in response.json().get("businesses", []):
                results.append({
                    "name": b.get("name"),
                    "website": b.get("url"),
                    "description": f"Rating: {b.get('rating')}, Reviews: {b.get('review_count')}",
                    "source": "yelp"
                })
    except Exception as e:
        print(f"Yelp search error: {e}")
    return results

def search_github(niche: str, location: str, max_results_per_source: int = 5):
    results = []
    try:
        headers = {"Accept": "application/vnd.github.v3+json"}
        if settings.GITHUB_TOKEN:
            headers["Authorization"] = f"token {settings.GITHUB_TOKEN}"
            
        search_query = f"{niche} location:{location}" if location else niche
        params = {"q": search_query, "per_page": max_results_per_source}
        response = httpx.get("https://api.github.com/search/users", headers=headers, params=params, timeout=10.0)
        
        if response.status_code == 200:
            for u in response.json().get("items", []):
                results.append({
                    "name": u.get("login"),
                    "website": u.get("html_url"),
                    "description": f"GitHub user matching {niche}",
                    "source": "github"
                })
    except Exception as e:
        print(f"GitHub search error: {e}")
    return results

def search_apify(niche: str, location: str, max_results_per_source: int = 5):
    if not settings.APIFY_API_TOKEN:
        print("Apify search skipped (API key not configured)")
        return []
    # Stub for Apify integration (Twitter/Facebook)
    print(f"Searching Apify for {niche} in {location}...")
    return []

def extract_intent_and_search(query: str):
    """Uses real multi-source search and Gemini for intent parsing & filtering."""
    parsed = parse_user_query(query)
    print(f"Parsed Intent: {parsed}")
    
    niche = parsed.get("niche", query)
    location = parsed.get("location", "")
    count = int(parsed.get("count", 10))
    
    max_per_source = max(5, int(count / 2) + 1)
    
    pool = search_duckduckgo(niche, location, max_per_source)
    maps_pool = search_google_maps(niche, location, max_per_source + 2)
    ai_pool = generate_ai_leads(niche, location, 3)
    
    # New sources
    apollo_pool = search_apollo(niche, location, max_per_source)
    crunchbase_pool = search_crunchbase(niche, location, max_per_source)
    reddit_pool = search_reddit(niche, location, max_per_source)
    yelp_pool = search_yelp(niche, location, max_per_source)
    github_pool = search_github(niche, location, max_per_source)
    apify_pool = search_apify(niche, location, max_per_source)
    
    pool.extend(maps_pool)
    pool.extend(ai_pool)
    pool.extend(apollo_pool)
    pool.extend(crunchbase_pool)
    pool.extend(reddit_pool)
    pool.extend(yelp_pool)
    pool.extend(github_pool)
    pool.extend(apify_pool)
    
    print(f"Found {len(pool)} potential candidates from all sources.")
    
    best_leads = filter_best_leads(query, pool, count)
    print(f"Filtered down to {len(best_leads)} top candidates.")
    
    return best_leads

def scrape_website(url: str) -> str:
    """Scrapes a website and returns its text content using httpx."""
    try:
        # Fallback to basic httpx request since Playwright is blocked
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
        response = httpx.get(url, timeout=15.0, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        return soup.get_text(separator=" ", strip=True)[:5000] # Limit tokens
    except Exception as e:
        print(f"Scraping error for {url}: {e}")
        return ""

def analyze_and_score_lead(company_name: str, website_text: str):
    """Analyzes website text using Gemini to find problems, generate a score, and extract contact info."""
    prompt = f"""
    Analyze this website content for {company_name}:
    
    CONTENT:
    {website_text[:4000]}
    
    Identify:
    1. Potential problems or missing features (e.g. outdated, no booking system, no CRM).
    2. Recommended software solutions we can sell them.
    3. A lead score from 0 to 100 indicating how likely they need our IT services.
    4. Extract any contact person name, email address, or phone number found in the text.
    
    Return ONLY valid JSON:
    {{
        "problems_identified": ["Missing features X", "Y"],
        "recommended_solution": ["ERP", "Custom App"],
        "lead_score": 85,
        "contact_person": "John Doe",
        "email": "contact@example.com",
        "phone": "+1-555-0192"
    }}
    """
    model = genai.GenerativeModel('gemini-flash-latest')
    try:
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3].strip()
        return json.loads(raw_text)
    except:
        return {
            "problems_identified": ["Could not analyze"], 
            "recommended_solution": ["General IT Consulting"], 
            "lead_score": 50,
            "contact_person": "",
            "email": "",
            "phone": ""
        }

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
        # Check if campaign was stopped mid-run
        db.refresh(campaign)
        if campaign.status == "Stopped":
            print(f"Campaign {campaign.name} was stopped. Halting lead generation.")
            break
            
        website = comp_data.get("website")
        
        # Deduplication check
        if website:
            existing = db.query(Company).filter(Company.website == website).first()
            if existing:
                print(f"Skipping duplicate lead: {existing.name}")
                continue

        # Create Company
        company = Company(
            name=comp_data.get("name"),
            website=website,
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
            campaign_id=campaign_id,
            contact_person=analysis.get("contact_person", ""),
            email=analysis.get("email", ""),
            phone=analysis.get("phone", ""),
            problems_identified=json.dumps(analysis.get("problems_identified", [])),
            recommended_solution=json.dumps(analysis.get("recommended_solution", [])),
            lead_score=analysis.get("lead_score", 0),
            source=comp_data.get("source", "ai")
        )
        db.add(lead)
        db.commit()
        
    if campaign.status != "Stopped":
        campaign.status = "Completed"
        db.commit()
    db.close()
    print("Campaign finished.")
