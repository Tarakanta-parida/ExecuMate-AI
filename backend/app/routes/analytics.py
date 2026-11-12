import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Dataset, Report
from ..schemas import DatasetResponse
from ..config import settings
from ..services.data_cleaning import analyze_dataset, clean_and_process_dataset

router = APIRouter(prefix="/api/data", tags=["Data Analytics & MIS"])

@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    safe_name = os.path.basename(file.filename or "")
    lower_name = safe_name.lower()
    if not (lower_name.endswith(".csv") or lower_name.endswith(".xlsx") or lower_name.endswith(".xls")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported.")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    analysis = analyze_dataset(file_path)

    ds = Dataset(
        filename=safe_name,
        storage_path=file_path,
        row_count=analysis["total_rows"],
        column_count=analysis["total_cols"],
        is_cleaned=False,
        status="uploaded"
    )
    db.add(ds)
    db.commit()
    db.refresh(ds)

    return DatasetResponse(
        id=ds.id,
        filename=ds.filename,
        row_count=ds.row_count,
        column_count=ds.column_count,
        is_cleaned=ds.is_cleaned,
        status=ds.status,
        created_at=ds.created_at,
        columns=analysis["columns"],
        rows=analysis["rows"]
    )

@router.get("/latest", response_model=Optional[DatasetResponse])
def get_latest_dataset(db: Session = Depends(get_db)):
    ds = db.query(Dataset).order_by(Dataset.created_at.desc()).first()
    if not ds or not ds.storage_path or not os.path.exists(ds.storage_path):
        return None
    analysis = analyze_dataset(ds.storage_path)
    return DatasetResponse(
        id=ds.id,
        filename=ds.filename,
        row_count=ds.row_count,
        column_count=ds.column_count,
        is_cleaned=ds.is_cleaned,
        status=ds.status,
        created_at=ds.created_at,
        columns=analysis["columns"],
        rows=analysis["rows"]
    )


@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: str, db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if ds.storage_path and os.path.exists(ds.storage_path):
        try:
            os.remove(ds.storage_path)
        except OSError:
            pass
    db.query(Report).filter(Report.dataset_id == dataset_id).update({Report.dataset_id: None})
    db.delete(ds)
    db.commit()
    return {"message": "Dataset deleted successfully", "id": dataset_id}


@router.get("/{dataset_id}/preview")
def preview_dataset(dataset_id: str, db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return analyze_dataset(ds.storage_path)

class CleanDatasetRequest(BaseModel):
    strategy: Optional[str] = "auto"


@router.post("/{dataset_id}/clean")
def clean_dataset(
    dataset_id: str,
    strategy: str = Query("auto", description="Imputation strategy: auto, mean, median, or max"),
    body: Optional[CleanDatasetRequest] = None,
    db: Session = Depends(get_db),
):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    chosen_strategy = (body.strategy if body and body.strategy else strategy) or "auto"
    cleaned_path = ds.storage_path.replace(".csv", "_cleaned.csv").replace(".xlsx", "_cleaned.xlsx")
    result = clean_and_process_dataset(ds.storage_path, output_path=cleaned_path, strategy=chosen_strategy)

    ds.is_cleaned = True
    ds.storage_path = cleaned_path
    ds.row_count = result["cleaned_rows"]
    ds.status = "cleaned"
    db.commit()

    return result

