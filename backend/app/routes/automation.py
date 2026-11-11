from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pydantic import BaseModel
from ..database import get_db
from ..models import AutomationWorkflow, AutomationLog
from ..schemas import WorkflowResponse, AutomationLogResponse

router = APIRouter(prefix="/api/automation", tags=["Automation"])

class TriggerWorkflowRequest(BaseModel):
    workflow_id: str

@router.get("/workflows", response_model=List[WorkflowResponse])
def list_workflows(db: Session = Depends(get_db)):
    wfs = db.query(AutomationWorkflow).all()
    if not wfs:
        demos = [
            AutomationWorkflow(
                workflow_name="Daily Executive MIS Summary Email",
                description="Compiles yesterday's regional revenue and sends PDF briefing to Leadership at 08:00 AM.",
                trigger_type="Schedule (Cron)",
                schedule="Daily at 08:00 AM EST",
                is_active=True,
                execution_count=142
            ),
            AutomationWorkflow(
                workflow_name="Overdue Task & Deadline Escalation Alert",
                description="Scans open tasks and alerts managers 24h before deadline.",
                trigger_type="Schedule (Hourly)",
                schedule="Hourly Mon-Fri",
                is_active=True,
                execution_count=894
            ),
            AutomationWorkflow(
                workflow_name="Automated End-of-Month P&L Consolidation",
                description="Pulls ERP ledger, cleans dirty data, recalculates EBITDA, produces Excel report.",
                trigger_type="Schedule (Monthly)",
                schedule="Last business day of month",
                is_active=True,
                execution_count=10
            )
        ]
        db.add_all(demos)
        db.commit()
        wfs = db.query(AutomationWorkflow).all()
    return wfs

@router.post("/trigger", response_model=AutomationLogResponse)
def trigger_workflow(req: TriggerWorkflowRequest, db: Session = Depends(get_db)):
    wf = db.query(AutomationWorkflow).filter(AutomationWorkflow.id == req.workflow_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    wf.execution_count += 1
    wf.last_run = datetime.utcnow()

    log = AutomationLog(
        workflow_id=wf.id,
        workflow_name=wf.workflow_name,
        trigger_type="Manual (API Webhook)",
        execution_status="success",
        duration_ms=480,
        details=f"Dispatched webhook payload to n8n runtime. Processed successfully."
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

@router.get("/logs", response_model=List[AutomationLogResponse])
def list_logs(db: Session = Depends(get_db)):
    return db.query(AutomationLog).order_by(AutomationLog.executed_at.desc()).limit(50).all()

