from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.models.lead import Lead as LeadModel
from app.schemas.lead import Lead, LeadCreate
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[Lead])
def read_leads(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve leads.
    """
    leads = db.query(LeadModel).offset(skip).limit(limit).all()
    return leads

@router.get("/{id}", response_model=Lead)
def read_lead(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
) -> Any:
    """
    Get lead by ID.
    """
    lead = db.query(LeadModel).filter(LeadModel.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@router.delete("/{id}")
def delete_lead(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
) -> Any:
    """
    Delete a lead by ID.
    """
    lead = db.query(LeadModel).filter(LeadModel.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(lead)
    db.commit()
    return {"message": "Lead deleted successfully"}
