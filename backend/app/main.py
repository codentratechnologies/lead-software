from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, leads, export, campaigns, emails, followups

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(leads.router, prefix=f"{settings.API_V1_STR}/leads", tags=["leads"])
app.include_router(export.router, prefix=f"{settings.API_V1_STR}/export", tags=["export"])
app.include_router(campaigns.router, prefix=f"{settings.API_V1_STR}/campaigns", tags=["campaigns"])
app.include_router(emails.router, prefix=f"{settings.API_V1_STR}/emails", tags=["emails"])
app.include_router(followups.router, prefix=f"{settings.API_V1_STR}/followups", tags=["followups"])

import threading
from firebase_worker import init_firebase, poll_for_campaigns

@app.on_event("startup")
def startup_event():
    print("Starting background AI worker inside Web Service...")
    init_firebase()
    
    # Run the worker in a separate thread so it doesn't block the API
    worker_thread = threading.Thread(target=poll_for_campaigns, daemon=True)
    worker_thread.start()

@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {"message": "Welcome to Codentra AI Lead Generator API"}
