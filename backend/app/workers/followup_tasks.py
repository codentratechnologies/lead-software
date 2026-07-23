from celery import shared_task
from datetime import datetime, date
import google.generativeai as genai

from app.core.database import SessionLocal
from app.models.followup import FollowUp
from app.models.email import Email
from app.core.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

@shared_task
def process_daily_followups():
    """
    Finds all followups due today and generates an email draft.
    """
    db = SessionLocal()
    today = date.today()
    
    # Simple check for any followup whose next_date matches today (ignoring time for MVP)
    # In a real app we'd query by date part
    followups = db.query(FollowUp).filter(FollowUp.status == "Pending").all()
    
    for followup in followups:
        if followup.next_date.date() <= today:
            print(f"Processing follow-up for lead {followup.lead_id}")
            lead = followup.lead
            company = lead.company if lead else None
            
            if not lead or not company:
                continue
                
            prompt = f"""
            You are a software sales rep. You are sending follow-up email # {followup.sequence_day} to {company.name}.
            They have problems with: {lead.problems_identified}
            We offer: {lead.recommended_solution}
            
            Write a short, polite follow-up email asking if they had time to consider our solution.
            
            Return ONLY valid JSON:
            {{
                "subject": "Quick follow-up",
                "body": "..."
            }}
            """
            
            model = genai.GenerativeModel('gemini-1.5-flash')
            try:
                response = model.generate_content(prompt)
                raw_text = response.text.strip()
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:-3].strip()
                import json
                data = json.loads(raw_text)
                
                email = Email(
                    lead_id=lead.id,
                    subject=data.get("subject", "Following up"),
                    body=data.get("body", "Failed to generate body.")
                )
                db.add(email)
                
                followup.status = "Completed"
                db.commit()
                
            except Exception as e:
                print(f"Failed to generate follow-up email: {e}")
                db.rollback()

    db.close()
