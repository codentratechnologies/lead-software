from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    website = Column(String)
    phone = Column(String)
    email = Column(String)
    address = Column(String)
    industry = Column(String, index=True)
    company_size = Column(String)
    social_links = Column(Text) # JSON string
    google_rating = Column(Float)
    description = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    leads = relationship("Lead", back_populates="company", cascade="all, delete-orphan")
