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


def search_openstreetmap(niche: str, location: str, max_results_per_source: int = 5):
    if not location:
        return []
        
    results = []
    # Take the first main word of the niche for better OSM matching (e.g. 'software companies' -> 'software')
    niche_keyword = niche.split()[0] if niche else "office"
    
    overpass_url = "https://overpass-api.de/api/interpreter"
    overpass_query = f"""
    [out:json][timeout:25];
    area[name~"(?i)^{location}"]->.searchArea;
    (
      node["name"~"(?i){niche_keyword}"](area.searchArea);
      way["name"~"(?i){niche_keyword}"](area.searchArea);
      node["office"~"(?i){niche_keyword}"](area.searchArea);
      node["amenity"~"(?i){niche_keyword}"](area.searchArea);
    );
    out tags {max_results_per_source};
    """
    
    try:
        print(f"Searching OpenStreetMap for {niche} in {location}...")
        response = httpx.post(overpass_url, data={"data": overpass_query}, timeout=30.0)
        
        if response.status_code == 200:
            data = response.json()
            for element in data.get("elements", []):
                tags = element.get("tags", {})
                name = tags.get("name")
                if not name: continue
                    
                website = tags.get("website", "")
                phone = tags.get("phone", "")
                
                desc = f"Category: {tags.get('amenity', tags.get('office', 'Business'))}"
                if phone: desc += f" | Phone: {phone}"
                
                results.append({
                    "name": name,
                    "website": website,
                    "description": desc,
                    "source": "openstreetmap"
                })
        else:
            print(f"OSM Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"OSM search error: {e}")
        
    return results

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
    
    results = []
    try:
        url = "https://api.apollo.io/v1/organizations/search"
        headers = {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache"
        }
        data = {
            "api_key": settings.APOLLO_API_KEY,
            "per_page": max_results_per_source
        }
        
        # Determine how to query based on provided niche/location
        if niche:
            data["q_organization_keyword_tags"] = [niche]
        if location:
            data["organization_locations"] = [location]
            
        print(f"Searching Apollo for {niche} in {location}...")
        response = httpx.post(url, headers=headers, json=data, timeout=15.0)
        
        if response.status_code == 200:
            orgs = response.json().get("organizations", [])
            for org in orgs:
                results.append({
                    "name": org.get("name"),
                    "website": org.get("website_url"),
                    "description": org.get("short_description") or org.get("seo_description") or f"Apollo matching {niche}",
                    "source": "apollo"
                })
        else:
            print(f"Apollo API error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Apollo search error: {e}")
    
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
    
    results = []
    try:
        # Using Apify's Google Search Scraper to find Facebook/Twitter profiles
        actor_id = "apify/google-search-scraper"
        url = f"https://api.apify.com/v2/acts/{actor_id}/run-sync-get-dataset-items"
        params = {"token": settings.APIFY_API_TOKEN}
        
        search_query = f"{niche} {location}".strip()
        data = {
            "queries": f"site:twitter.com OR site:facebook.com {search_query}",
            "resultsPerPage": max_results_per_source
        }
        
        print(f"Searching Apify for {search_query} on social media...")
        # Apify synchronous runs can take a bit longer as it spins up a container
        response = httpx.post(url, params=params, json=data, timeout=45.0)
        
        if response.status_code in (200, 201):
            items = response.json()
            for item in items:
                # The google-search-scraper returns a list of results in 'organicResults'
                if "organicResults" in item:
                    for org in item["organicResults"][:max_results_per_source]:
                        results.append({
                            "name": org.get("title", "Unknown Social Profile"),
                            "website": org.get("url", ""),
                            "description": org.get("description", f"Social profile for {niche}"),
                            "source": "apify-social"
                        })
        else:
            print(f"Apify API error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Apify search error: {e}")
        
    return results

def extract_intent_and_search(query: str):
    """Uses real multi-source search and Gemini for intent parsing & filtering."""
    parsed = parse_user_query(query)
    print(f"Parsed Intent: {parsed}")
    
    niche = parsed.get("niche", query)
    location = parsed.get("location", "")
    count = int(parsed.get("count", 10))
    
    max_per_source = max(5, int(count / 2) + 1)
    
    pool = search_duckduckgo(niche, location, max_per_source)
    osm_pool = search_openstreetmap(niche, location, max_per_source + 2)
    ai_pool = generate_ai_leads(niche, location, 3)
    
    # New sources
    apollo_pool = search_apollo(niche, location, max_per_source)
    github_pool = search_github(niche, location, max_per_source)
    apify_pool = search_apify(niche, location, max_per_source)
    
    pool.extend(osm_pool)
    pool.extend(ai_pool)
    pool.extend(apollo_pool)
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
