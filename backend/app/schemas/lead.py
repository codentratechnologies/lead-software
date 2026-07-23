from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class CompanyBase(BaseModel):
    name: str
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    google_rating: Optional[float] = None
    description: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class Company(CompanyBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class LeadBase(BaseModel):
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    problems_identified: Optional[str] = None
    recommended_solution: Optional[str] = None
    lead_score: Optional[float] = None
    status: Optional[str] = "New"

class LeadCreate(LeadBase):
    company_id: int
    campaign_id: Optional[int] = None

class Lead(LeadBase):
    id: int
    company_id: int
    campaign_id: Optional[int] = None
    created_at: datetime
    
    company: Optional[Company] = None
    
    class Config:
        from_attributes = True
