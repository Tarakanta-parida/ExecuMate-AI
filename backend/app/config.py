import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "ExecuMate AI"
    APP_VERSION: str = "1.0.0"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "execumate-secure-secret-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Defaults to SQLite locally if PostgreSQL is not provisioned; compatible with postgresql://
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./execumate.db")
    
    UPLOAD_DIR: str = os.path.join(os.path.dirname(__file__), "..", "uploads")
    REPORTS_DIR: str = os.path.join(os.path.dirname(__file__), "..", "reports_generated")
    
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]

settings = Settings()

# Ensure storage directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)

