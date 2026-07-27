from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    
    contact_person = Column(String)
    email = Column(String)
    phone = Column(String)
    
    problems_identified = Column(Text) # JSON string
    recommended_solution = Column(Text) # JSON string
    lead_score = Column(Float)
    status = Column(String, default="New") # New, Contacted, Meeting Scheduled, etc.
    source = Column(String, default="ai") # maps, linkedin, instagram, ai
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    company = relationship("Company", back_populates="leads")
    campaign = relationship("Campaign", back_populates="leads")
