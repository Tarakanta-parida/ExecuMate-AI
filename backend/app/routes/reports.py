import os
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from ..database import get_db
from ..models import Report, Dataset
from ..schemas import ReportResponse
from ..config import settings
from ..services.report_generator import generate_excel_mis_report
from ..services.data_cleaning import _load_dataframe

router = APIRouter(prefix="/api/reports", tags=["MIS Reports"])

class GenerateReportRequest(BaseModel):
    report_name: Optional[str] = "Executive_MIS_Report.xlsx"
    dataset_id: Optional[str] = None
    category: Optional[str] = "Executive MIS"
    dataset_name: Optional[str] = None
    rows: Optional[List[Dict[str, Any]]] = None
    imputation_details: Optional[List[Dict[str, Any]]] = None

@router.get("", response_model=List[ReportResponse])
def list_reports(db: Session = Depends(get_db)):
    return db.query(Report).order_by(Report.generated_at.desc()).all()

@router.post("/generate", response_model=ReportResponse)
def generate_report(req: GenerateReportRequest, db: Session = Depends(get_db)):
    output_filename = os.path.basename(req.report_name or "Executive_MIS_Report.xlsx")
    if not output_filename.endswith(".xlsx"):
        output_filename += ".xlsx"

    df = None
    source_name = req.dataset_name

    if req.rows and len(req.rows) > 0:
        df = pd.DataFrame(req.rows)
    elif req.dataset_id:
        ds = db.query(Dataset).filter(Dataset.id == req.dataset_id).first()
        if ds and os.path.exists(ds.storage_path):
            df = _load_dataframe(ds.storage_path)
            source_name = source_name or ds.filename

    if df is None or df.empty:
        raise HTTPException(status_code=400, detail="Please upload a CSV or Excel dataset first before generating a report.")

    os.makedirs(settings.REPORTS_DIR, exist_ok=True)
    file_path = os.path.join(settings.REPORTS_DIR, output_filename)

    generate_excel_mis_report(
        df,
        file_path,
        report_title=output_filename.replace(".xlsx", ""),
        dataset_name=source_name,
        imputation_details=req.imputation_details
    )

    rep = Report(
        report_name=output_filename,
        category=req.category or "Executive MIS",
        file_path=file_path,
        file_size=f"{os.path.getsize(file_path) / 1024:.1f} KB",
        dataset_id=req.dataset_id
    )
    db.add(rep)
    db.commit()
    db.refresh(rep)
    return rep

@router.get("/{report_id}/download")
def download_report(report_id: str, db: Session = Depends(get_db)):
    rep = db.query(Report).filter(Report.id == report_id).first()
    if not rep or not os.path.exists(rep.file_path):
        raise HTTPException(status_code=404, detail="Report file not found")
    return FileResponse(
        path=rep.file_path,
        filename=rep.report_name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@router.delete("/{report_id}")
def delete_report(report_id: str, db: Session = Depends(get_db)):
    rep = db.query(Report).filter(Report.id == report_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report file not found")
    
    # Remove file from disk if it exists
    if rep.file_path and os.path.exists(rep.file_path):
        try:
            os.remove(rep.file_path)
        except OSError:
            pass
            
    db.delete(rep)
    db.commit()

    seed_marker = os.path.join(settings.REPORTS_DIR, ".initial_report_seeded")
    if not os.path.exists(seed_marker):
        os.makedirs(settings.REPORTS_DIR, exist_ok=True)
        with open(seed_marker, "w") as f:
            f.write("seeded\n")

    return {"message": "Report deleted successfully", "id": report_id}


