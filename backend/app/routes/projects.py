from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Project
from ..schemas import ProjectCreate, ProjectResponse

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    if not projects:
        # Seed initial projects if empty
        demo_projects = [
            Project(project_name="Q4 Strategic Expansion & M&A", description="Executive due diligence and market entry.", status="active", progress=75),
            Project(project_name="Enterprise Cloud & Lakehouse Migration", description="Consolidating data into BigQuery.", status="active", progress=42),
            Project(project_name="APAC Supply Chain Resiliency", description="Mitigating vendor lead-time bottlenecks.", status="at_risk", progress=28),
            Project(project_name="Annual ESG Compliance & Audit 2026", description="Carbon footprint reporting and certification.", status="active", progress=90),
        ]
        db.add_all(demo_projects)
        db.commit()
        projects = db.query(Project).all()
    return projects

@router.post("", response_model=ProjectResponse)
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    proj = Project(**data.model_dump())
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj

