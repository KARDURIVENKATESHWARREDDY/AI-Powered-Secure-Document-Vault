import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.security.auth import get_password_hash
from app.routes import auth, documents, upload, analytics, chat

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Bind LangSmith Tracing Environment Variables on startup
if settings.LANGCHAIN_TRACING_V2.lower() == "true":
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_ENDPOINT"] = settings.LANGCHAIN_ENDPOINT
    os.environ["LANGCHAIN_PROJECT"] = settings.LANGCHAIN_PROJECT
    if settings.LANGCHAIN_API_KEY:
        os.environ["LANGCHAIN_API_KEY"] = settings.LANGCHAIN_API_KEY

if settings.LANGSMITH_TRACING.lower() == "true":
    os.environ["LANGSMITH_TRACING"] = "true"
    os.environ["LANGSMITH_ENDPOINT"] = settings.LANGSMITH_ENDPOINT
    os.environ["LANGSMITH_PROJECT"] = settings.LANGSMITH_PROJECT
    if settings.LANGSMITH_API_KEY:
        os.environ["LANGSMITH_API_KEY"] = settings.LANGSMITH_API_KEY

if settings.ANTHROPIC_API_KEY:
    os.environ["ANTHROPIC_API_KEY"] = settings.ANTHROPIC_API_KEY

# Create exports directory
os.makedirs("./static/exports", exist_ok=True)

# Seed Admin User if missing
db = SessionLocal()
try:
    admin_user = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
    if not admin_user:
        hashed_pwd = get_password_hash(settings.ADMIN_PASSWORD)
        default_admin = User(
            email=settings.ADMIN_EMAIL,
            hashed_password=hashed_pwd,
            full_name="System Administrator",
            role="admin"
        )
        db.add(default_admin)
        db.commit()
        print(f"Seeded default administrator: {settings.ADMIN_EMAIL}")
    
    # Fix existing users with incorrect "viewer" role (should be "editor")
    viewer_users = db.query(User).filter(User.role == "viewer").all()
    if viewer_users:
        for vu in viewer_users:
            vu.role = "editor"
        db.commit()
        print(f"Migrated {len(viewer_users)} user(s) from 'viewer' to 'editor' role.")
finally:
    db.close()

# Instantiate FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Secure Document Vault Multi-Agent System Backend",
    version="1.0.0"
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production to match Next.js domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files folder
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(upload.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs": "/docs",
        "api_v1_base": settings.API_V1_STR
    }
