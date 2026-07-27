from ddgs import DDGS
import json
import time

class DummyGenAI:
    class GenerativeModel:
        def __init__(self, name):
            pass
        def generate_content(self, prompt):
            class Response:
                text = "```json\n{\n  \"niche\": \"software companies\",\n  \"location\": \"Pune\",\n  \"count\": 5\n}\n```"
            return Response()

genai = DummyGenAI()

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
    
    print(f"Searching web for: {search_query}")
    try:
        web_results = DDGS().text(search_query, max_results=max_results_per_source)
        for r in web_results:
            results.append({"name": r.get("title", ""), "website": r.get("href", ""), "description": r.get("body", ""), "source": "web"})
    except Exception as e:
        print(f"Web search error: {e}")
        
    time.sleep(1)

    print(f"Searching linkedin for: site:linkedin.com/company {search_query}")
    try:
        li_query = f"site:linkedin.com/company {search_query}"
        li_results = DDGS().text(li_query, max_results=max_results_per_source)
        for r in li_results:
            results.append({"name": r.get("title", ""), "website": r.get("href", ""), "description": r.get("body", ""), "source": "linkedin"})
    except Exception as e:
        print(f"LinkedIn search error: {e}")

    time.sleep(1)

    print(f"Searching instagram for: site:instagram.com {search_query}")
    try:
        ig_query = f"site:instagram.com {search_query}"
        ig_results = DDGS().text(ig_query, max_results=max_results_per_source)
        for r in ig_results:
            results.append({"name": r.get("title", ""), "website": r.get("href", ""), "description": r.get("body", ""), "source": "instagram"})
    except Exception as e:
        print(f"Instagram search error: {e}")
        
    return results

def test():
    query = "Find me 5 software companies in Pune"
    parsed = parse_user_query(query)
    print(parsed)
    pool = search_duckduckgo(parsed["niche"], parsed["location"], 2)
    print(json.dumps(pool, indent=2))

if __name__ == "__main__":
    test()
