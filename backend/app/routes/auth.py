from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import LoginRequest, LoginResponse, UserResponse, UserBase

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=LoginResponse)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == creds.email).first()
    
    # If initial user doesn't exist yet, auto-seed default director
    if not user:
        user = User(
            full_name="Sarah Jenkins",
            email=creds.email,
            password_hash="hashed_pw",
            role="Director",
            department="Executive Board"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return LoginResponse(
        access_token=f"jwt-mock-token-{user.id}",
        user=user
    )

@router.get("/me", response_model=UserResponse)
def get_me(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        user = User(
            full_name="Sarah Jenkins",
            email="sarah.jenkins@execumate.ai",
            password_hash="hashed_pw",
            role="Director",
            department="Executive Board"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@router.put("/profile", response_model=UserResponse)
def update_profile(data: UserBase, db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        user = User(
            full_name=data.full_name,
            email=data.email,
            password_hash="hashed_pw",
            role=data.role,
            department=data.department or "Operations"
        )
        db.add(user)
    else:
        user.full_name = data.full_name
        user.email = data.email
        user.role = data.role
        user.department = data.department or user.department

    db.commit()
    db.refresh(user)
    return user


