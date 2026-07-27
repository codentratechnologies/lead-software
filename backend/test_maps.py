from playwright.sync_api import sync_playwright
import time
import json

def test_maps_scrape(query: str):
    print(f"Scraping Maps for: {query}")
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Navigate to Google Maps search
        url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}"
        page.goto(url, timeout=30000)
        
        try:
            page.wait_for_selector('div[role="feed"]', timeout=5000)
        except Exception:
            try:
                page.wait_for_selector('h1', timeout=5000)
            except Exception as e:
                print("Could not find results feed.", e)
        
        time.sleep(3)
        
        # The list items are often role="article" or similar. Let's find links that look like maps places
        # Links to places usually start with "https://www.google.com/maps/place/"
        links = page.locator('a[href*="/maps/place/"]').all()
        
        places = []
        for link in links:
            href = link.get_attribute("href")
            # The aria-label usually contains the place name
            name = link.get_attribute("aria-label")
            if name and href:
                places.append({"name": name, "url": href})
                
        print(json.dumps(places, indent=2))
        browser.close()

if __name__ == "__main__":
    test_maps_scrape("cafe in surat")
