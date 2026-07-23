from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.api import deps
from app.models.campaign import Campaign
from app.models.user import User
from app.workers.lead_tasks import process_lead_campaign

router = APIRouter()

class CampaignCreate(BaseModel):
    name: str
    search_query: str
    description: Optional[str] = None

@router.post("/")
def create_campaign(
    campaign_in: CampaignCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Start a lead generation campaign based on natural language command.
    """
    campaign = Campaign(
        name=campaign_in.name,
        search_query=campaign_in.search_query,
        description=campaign_in.description
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    
    # Trigger celery task
    process_lead_campaign.delay(campaign.id)
    
    return {"message": "Campaign started", "campaign_id": campaign.id}
