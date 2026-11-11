import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Dataset
from ..schemas import DatasetResponse
from ..config import settings
from ..services.data_cleaning import analyze_dataset, clean_and_process_dataset

router = APIRouter(prefix="/api/data", tags=["Data Analytics & MIS"])

@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not (file.filename.endswith(".csv") or file.filename.endswith(".xlsx") or file.filename.endswith(".xls")):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported.")

    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    analysis = analyze_dataset(file_path)

    ds = Dataset(
        filename=file.filename,
        storage_path=file_path,
        row_count=analysis["total_rows"],
        column_count=analysis["total_cols"],
        is_cleaned=False,
        status="uploaded"
    )
    db.add(ds)
    db.commit()
    db.refresh(ds)
    return ds

@router.get("/{dataset_id}/preview")
def preview_dataset(dataset_id: str, db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return analyze_dataset(ds.storage_path)

@router.post("/{dataset_id}/clean")
def clean_dataset(dataset_id: str, db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    cleaned_path = ds.storage_path.replace(".csv", "_cleaned.csv").replace(".xlsx", "_cleaned.xlsx")
    result = clean_and_process_dataset(ds.storage_path, output_path=cleaned_path)

    ds.is_cleaned = True
    ds.storage_path = cleaned_path
    ds.row_count = result["cleaned_rows"]
    ds.status = "cleaned"
    db.commit()

    return result

