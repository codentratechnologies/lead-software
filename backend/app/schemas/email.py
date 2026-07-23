from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class EmailBase(BaseModel):
    subject: str
    body: str
    status: Optional[str] = "Draft"
    sent_at: Optional[datetime] = None

class EmailCreate(EmailBase):
    lead_id: int

class Email(EmailBase):
    id: int
    lead_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class FollowUpBase(BaseModel):
    next_date: datetime
    sequence_day: Optional[int] = 1
    status: Optional[str] = "Pending"

class FollowUpCreate(FollowUpBase):
    lead_id: int

class FollowUp(FollowUpBase):
    id: int
    lead_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
