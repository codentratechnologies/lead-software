from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String)
    
    # E.g. "Find 100 manufacturing companies in Gujarat"
    search_query = Column(String) 
    
    status = Column(String, default="Running") # Running, Completed, Failed
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    leads = relationship("Lead", back_populates="campaign", cascade="all, delete-orphan")
