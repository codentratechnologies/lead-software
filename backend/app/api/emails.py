import json
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import google.generativeai as genai

from app.api import deps
from app.models.lead import Lead as LeadModel
from app.models.email import Email as EmailModel
from app.schemas.email import Email, EmailCreate
from app.models.user import User
from app.core.config import settings

router = APIRouter()
genai.configure(api_key=settings.GEMINI_API_KEY)

class GenerateEmailRequest(BaseModel):
    lead_id: int

@router.post("/generate", response_model=Email)
def generate_email(
    request: GenerateEmailRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Generate a personalized email for a specific lead using AI.
    """
    lead = db.query(LeadModel).filter(LeadModel.id == request.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    company = lead.company
    
    prompt = f"""
    You are an expert software sales representative for Codentra Technologies.
    Write a highly personalized, concise outreach email to this lead.
    
    Company: {company.name}
    Industry: {company.industry}
    Contact Person: {lead.contact_person or "Founder/CEO"}
    
    Problems Identified: {lead.problems_identified}
    Recommended Solution from Codentra: {lead.recommended_solution}
    
    The email must mention their specific problems and how Codentra's specific solution can help them. 
    Keep it professional but conversational.
    
    Return ONLY valid JSON in this format:
    {{
        "subject": "The email subject",
        "body": "The email body..."
    }}
    """
    
    model = genai.GenerativeModel('gemini-1.5-flash')
    try:
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3].strip()
        data = json.loads(raw_text)
        
        email = EmailModel(
            lead_id=lead.id,
            subject=data.get("subject", "Automating operations at " + company.name),
            body=data.get("body", "Failed to generate body.")
        )
        db.add(email)
        db.commit()
        db.refresh(email)
        return email
        
    except Exception as e:
        print(f"Failed to generate email: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate email via AI")

@router.get("/{lead_id}", response_model=List[Email])
def get_emails_for_lead(
    lead_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all emails generated for a lead.
    """
    emails = db.query(EmailModel).filter(EmailModel.lead_id == lead_id).all()
    return emails
