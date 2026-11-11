import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Document, DocumentChunk
from ..schemas import DocumentResponse, DocumentQuestionRequest, DocumentQuestionResponse
from ..config import settings
from ..services.pdf_extractor import extract_text_from_pdf
from ..services.ai_service import generate_document_summary, answer_document_question

router = APIRouter(prefix="/api/documents", tags=["Documents & AI Research"])

@router.get("", response_model=List[DocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    return db.query(Document).order_by(Document.uploaded_at.desc()).all()

@router.post("/upload", response_model=DocumentResponse)
async def upload_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text with PyMuPDF
    chunks_data = extract_text_from_pdf(file_path)
    summary_data = generate_document_summary(chunks_data)

    file_size_mb = f"{os.path.getsize(file_path) / (1024 * 1024):.1f} MB"

    doc = Document(
        filename=file.filename,
        storage_path=file_path,
        file_size=file_size_mb,
        page_count=len(chunks_data),
        summary=summary_data["summary"],
        status="ready"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    for chunk in chunks_data:
        c = DocumentChunk(
            document_id=doc.id,
            page_number=chunk["page_number"],
            content=chunk["content"]
        )
        db.add(c)
    db.commit()

    return doc

@router.post("/{doc_id}/summarize")
def summarize_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).all()
    chunks_data = [{"page_number": c.page_number, "content": c.content} for c in chunks]
    return generate_document_summary(chunks_data)

@router.post("/{doc_id}/ask", response_model=DocumentQuestionResponse)
def ask_document_question_api(doc_id: str, req: DocumentQuestionRequest, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).all()
    chunks_data = [{"page_number": c.page_number, "content": c.content} for c in chunks]
    return answer_document_question(req.question, chunks_data)

@router.delete("/{doc_id}")
def delete_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.storage_path and os.path.exists(doc.storage_path):
        try:
            os.remove(doc.storage_path)
        except OSError:
            pass

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully", "id": doc_id}


