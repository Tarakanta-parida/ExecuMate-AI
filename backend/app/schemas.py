from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Dict
from datetime import datetime, date

class UserBase(BaseModel):
    full_name: str
    email: str
    role: str
    department: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ProjectBase(BaseModel):
    project_name: str
    description: Optional[str] = None
    status: Optional[str] = "active"
    progress: Optional[int] = 0
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: str
    owner_id: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"
    status: Optional[str] = "pending"
    due_date: Optional[date] = None
    project_id: Optional[str] = None
    assigned_to: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[date] = None
    assigned_to: Optional[str] = None

class TaskResponse(TaskBase):
    id: str
    created_at: datetime
    is_overdue: Optional[bool] = False
    project_name: Optional[str] = None
    assignee_name: Optional[str] = None
    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_size: Optional[str] = None
    page_count: int
    summary: Optional[str] = None
    status: str
    uploaded_at: datetime
    class Config:
        from_attributes = True

class DocumentQuestionRequest(BaseModel):
    question: str

class Citation(BaseModel):
    page: int
    text: str

class DocumentQuestionResponse(BaseModel):
    answer: str
    citations: List[Citation] = []

class DatasetResponse(BaseModel):
    id: str
    filename: str
    row_count: int
    column_count: int
    is_cleaned: bool
    status: str
    created_at: datetime
    columns: List[str] = []
    rows: List[Dict[str, Any]] = []
    class Config:
        from_attributes = True

class ReportResponse(BaseModel):
    id: str
    report_name: str
    category: str
    file_path: str
    file_size: str
    generated_at: datetime
    class Config:
        from_attributes = True

class WorkflowResponse(BaseModel):
    id: str
    workflow_name: str
    description: Optional[str] = None
    trigger_type: str
    schedule: Optional[str] = None
    is_active: bool
    last_run: Optional[datetime] = None
    execution_count: int
    class Config:
        from_attributes = True

class AutomationLogResponse(BaseModel):
    id: str
    workflow_name: Optional[str] = None
    trigger_type: str
    execution_status: str
    duration_ms: int
    details: Optional[str] = None
    executed_at: datetime
    class Config:
        from_attributes = True

