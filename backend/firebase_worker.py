import os
import time
import firebase_admin
from firebase_admin import credentials, db

# Import existing AI logic from the backend
from app.workers.lead_tasks import extract_intent_and_search, analyze_and_score_lead, scrape_website

def init_firebase():
    cred_path = os.path.join(os.path.dirname(__file__), "firebase-service-account.json")
    if not os.path.exists(cred_path):
        print(f"[Error] Service account key not found at {cred_path}")
        print("Please download it from Firebase Console (Project Settings > Service accounts), rename it to 'firebase-service-account.json' and place it in the backend folder.")
        exit(1)
        
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://codentra-lead-generate-default-rtdb.asia-southeast1.firebasedatabase.app'
    })
    print("[Success] Successfully connected to Firebase Realtime Database.")

def process_campaign(campaign_id, campaign_data):
    print(f"\n[Processing] Processing campaign: {campaign_data.get('name')}")
    
    # Mark as processing so we don't pick it up again
    campaigns_ref = db.reference(f'campaigns/{campaign_id}')
    campaigns_ref.update({"status": "Processing"})
    
    query = campaign_data.get('search_query', '')
    
    # Run the exact same AI logic from lead_tasks.py
    companies_data = extract_intent_and_search(query)
    
    leads_ref = db.reference('leads')
    leads_generated = 0
    
    for comp_data in companies_data:
        website = comp_data.get("website")
        name = comp_data.get("name")
        
        website_text = scrape_website(website) if website else ""
        analysis = analyze_and_score_lead(name, website_text)
        
        # Add index-based fallback for the dashboard UI parsing
        problems = analysis.get("problems_identified", [])
        solutions = analysis.get("recommended_solution", [])
        
        # If it returned a list, stringify it (the dashboard UI expects strings for these currently)
        if isinstance(problems, list):
            problems_str = ", ".join(problems)
        else:
            problems_str = str(problems)
            
        if isinstance(solutions, list):
            solutions_str = ", ".join(solutions)
        else:
            solutions_str = str(solutions)
        
        lead_data = {
            "campaign_id": campaign_id,
            "company": {
                "name": name,
                "website": website,
                "industry": comp_data.get("industry", "Unknown")
            },
            "contact_person": analysis.get("contact_person", ""),
            "email": analysis.get("email", ""),
            "phone": analysis.get("phone", ""),
            "problems_identified": problems_str,
            "recommended_solution": solutions_str,
            "lead_score": analysis.get("lead_score", 0),
            "source": comp_data.get("source", "ai"),
            "status": "New",
            "created_at": {".sv": "timestamp"} # Server timestamp
        }
        
        leads_ref.push(lead_data)
        leads_generated += 1
        print(f"   Generated lead: {name} (Score: {analysis.get('lead_score', 0)})")
        
    # Mark campaign as completed
    campaigns_ref.update({
        "status": "Completed",
        "leads_count": leads_generated
    })
    print(f"[Success] Campaign completed with {leads_generated} leads.\n")

def poll_for_campaigns():
    print("[Status] Listening for new campaigns...")
    while True:
        try:
            # Query all campaigns and filter in python to avoid Firebase indexing rule errors
            ref = db.reference('campaigns')
            campaigns = ref.get()
            
            if campaigns:
                for campaign_id, campaign_data in campaigns.items():
                    if campaign_data.get('status') == 'Running':
                        try:
                            process_campaign(campaign_id, campaign_data)
                        except Exception as e:
                            print(f"[Error] Error processing campaign {campaign_id}: {e}")
                            db.reference(f'campaigns/{campaign_id}').update({"status": "Failed"})
            
        except Exception as e:
            print(f"[Warning] Polling error: {e}")
            
        time.sleep(5) # Poll every 5 seconds

if __name__ == "__main__":
    init_firebase()
    poll_for_campaigns()
