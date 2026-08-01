from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Codentra AI Lead Generator"
    API_V1_STR: str = "/api"
    
    SECRET_KEY: str = "CHANGE_THIS_IN_PRODUCTION_09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "codentra_leads"
    SQLALCHEMY_DATABASE_URI: Optional[str] = None
    
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # AI Providers
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    
    # Lead Generation Sources API Keys
    APOLLO_API_KEY: Optional[str] = None
    CRUNCHBASE_API_KEY: Optional[str] = None
    REDDIT_CLIENT_ID: Optional[str] = None
    REDDIT_CLIENT_SECRET: Optional[str] = None
    YELP_API_KEY: Optional[str] = None
    GITHUB_TOKEN: Optional[str] = None
    APIFY_API_TOKEN: Optional[str] = None

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

if not settings.SQLALCHEMY_DATABASE_URI:
    settings.SQLALCHEMY_DATABASE_URI = "sqlite:///./sql_app.db"
