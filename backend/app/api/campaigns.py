from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.api import deps
from app.models.campaign import Campaign
from app.models.lead import Lead
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
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
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
    
    # Trigger task using FastAPI BackgroundTasks to avoid Redis dependency
    background_tasks.add_task(process_lead_campaign, campaign.id)
    
    return {"message": "Campaign started", "campaign_id": campaign.id}

@router.get("/")
def get_campaigns(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all campaigns.
    """
    campaigns = db.query(Campaign).order_by(Campaign.id.desc()).offset(skip).limit(limit).all()
    result = []
    for c in campaigns:
        leads_count = db.query(Lead).filter(Lead.campaign_id == c.id).count()
        result.append({
            "id": c.id,
            "name": c.name,
            "search_query": c.search_query,
            "status": c.status,
            "leads_generated": leads_count,
            "created_at": c.created_at
        })
    return result

@router.post("/{id}/stop")
def stop_campaign(
    id: int,
    db: Session = Depends(deps.get_db),
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    campaign.status = "Stopped"
    db.commit()
    return {"message": "Campaign stopped successfully"}

@router.delete("/{id}")
def delete_campaign(
    id: int,
    db: Session = Depends(deps.get_db),
):
    """
    Delete a campaign by ID.
    """
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    db.delete(campaign)
    db.commit()
    return {"message": "Campaign deleted successfully"}
