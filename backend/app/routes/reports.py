import os
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from ..database import get_db
from ..models import Report, Dataset
from ..schemas import ReportResponse
from ..config import settings
from ..services.report_generator import generate_excel_mis_report

router = APIRouter(prefix="/api/reports", tags=["MIS Reports"])

class GenerateReportRequest(BaseModel):
    report_name: Optional[str] = "Executive_MIS_Report.xlsx"
    dataset_id: Optional[str] = None
    category: Optional[str] = "Executive MIS"

@router.get("", response_model=List[ReportResponse])
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).order_by(Report.generated_at.desc()).all()
    seed_marker = os.path.join(settings.REPORTS_DIR, ".initial_report_seeded")
    if not reports and not os.path.exists(seed_marker):
        # Generate initial demo report once on first boot
        sample_path = os.path.join(settings.REPORTS_DIR, "Q4_Regional_Sales_Performance_MIS.xlsx")
        df_sample = pd.DataFrame([
            {"Region": "North America", "Revenue": 327500, "Units": 545, "Margin_Pct": 68.2},
            {"Region": "EMEA", "Revenue": 125000, "Units": 250, "Margin_Pct": 56.0},
            {"Region": "APAC", "Revenue": 63200, "Units": 98, "Margin_Pct": 41.2},
            {"Region": "LATAM", "Revenue": 70000, "Units": 103, "Margin_Pct": 51.0}
        ])
        generate_excel_mis_report(df_sample, sample_path, "Q4 Regional Sales Performance MIS")

        rep = Report(
            report_name="Q4_Regional_Sales_Performance_MIS.xlsx",
            category="Financial Analytics",
            file_path=sample_path,
            file_size="1.4 MB"
        )
        db.add(rep)
        db.commit()
        os.makedirs(settings.REPORTS_DIR, exist_ok=True)
        with open(seed_marker, "w") as f:
            f.write("seeded\n")
        reports = db.query(Report).order_by(Report.generated_at.desc()).all()
    return reports

@router.post("/generate", response_model=ReportResponse)
def generate_report(req: GenerateReportRequest, db: Session = Depends(get_db)):
    output_filename = req.report_name or "Executive_MIS_Report.xlsx"
    if not output_filename.endswith(".xlsx"):
        output_filename += ".xlsx"

    file_path = os.path.join(settings.REPORTS_DIR, output_filename)

    # Use dataset or generate from synthetic enterprise ledger
    df = pd.DataFrame([
        {"Region": "North America", "Category": "Cloud SaaS", "Revenue": 272500, "Units": 545, "Margin": 70.0},
        {"Region": "EMEA", "Category": "Hardware", "Revenue": 125000, "Units": 250, "Margin": 40.0},
        {"Region": "APAC", "Category": "Professional Services", "Revenue": 63200, "Units": 98, "Margin": 44.1},
        {"Region": "LATAM", "Category": "Cloud SaaS", "Revenue": 70000, "Units": 103, "Margin": 65.0}
    ])

    generate_excel_mis_report(df, file_path, output_filename.replace(".xlsx", ""))

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


