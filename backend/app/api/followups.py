from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.api import deps
from app.models.lead import Lead as LeadModel
from app.models.followup import FollowUp as FollowUpModel
from app.schemas.email import FollowUp, FollowUpCreate
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=FollowUp)
def create_followup(
    followup_in: FollowUpCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Schedule a follow-up for a lead.
    """
    lead = db.query(LeadModel).filter(LeadModel.id == followup_in.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    followup = FollowUpModel(
        lead_id=followup_in.lead_id,
        next_date=followup_in.next_date,
        sequence_day=followup_in.sequence_day,
        status="Pending"
    )
    db.add(followup)
    db.commit()
    db.refresh(followup)
    
    # Update lead status
    lead.status = "Contacted"
    db.commit()
    
    return followup

@router.get("/", response_model=List[FollowUp])
def get_all_followups(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all pending follow-ups.
    """
    followups = db.query(FollowUpModel).filter(FollowUpModel.status == "Pending").order_by(FollowUpModel.next_date.asc()).all()
    return followups
