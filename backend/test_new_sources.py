from app.workers.lead_tasks import (
    search_apollo,
    search_crunchbase,
    search_reddit,
    search_yelp,
    search_github,
    search_apify
)

def test_sources():
    print("Testing new sources with missing API keys (should return empty lists and print skipped)...")
    
    niche = "software companies"
    location = "San Francisco"
    
    res_apollo = search_apollo(niche, location, 2)
    assert res_apollo == [], "Apollo should be empty without key"
    
    res_crunchbase = search_crunchbase(niche, location, 2)
    assert res_crunchbase == [], "Crunchbase should be empty without key"
    
    res_reddit = search_reddit(niche, location, 2)
    assert res_reddit == [], "Reddit should be empty without key"
    
    res_yelp = search_yelp(niche, location, 2)
    assert res_yelp == [], "Yelp should be empty without key"
    
    res_github = search_github(niche, location, 2)
    # GitHub doesn't require a key strictly, so it might return results or rate limit.
    print(f"GitHub results: {len(res_github)}")
    
    res_apify = search_apify(niche, location, 2)
    assert res_apify == [], "Apify should be empty without key"
    
    print("All tests passed.")

if __name__ == '__main__':
    test_sources()
