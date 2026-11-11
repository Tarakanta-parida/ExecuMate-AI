import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, Boolean, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    role = Column(String(50), default="analyst") # director, manager, analyst, research_assistant
    department = Column(String(100), default="Operations")
    created_at = Column(DateTime, default=datetime.utcnow)

    projects = relationship("Project", back_populates="owner")
    tasks = relationship("Task", back_populates="assignee")
    documents = relationship("Document", back_populates="user")
    datasets = relationship("Dataset", back_populates="user")
    reports = relationship("Report", back_populates="user")

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    project_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(30), default="active") # active, at_risk, completed
    progress = Column(Integer, default=0)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=True)
    assigned_to = Column(String(36), ForeignKey("users.id"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(20), default="medium") # high, medium, low
    status = Column(String(30), default="pending") # pending, in_progress, completed
    due_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="tasks")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    filename = Column(String(255), nullable=False)
    storage_path = Column(Text, nullable=False)
    file_size = Column(String(50), nullable=True)
    page_count = Column(Integer, default=0)
    summary = Column(Text, nullable=True)
    status = Column(String(30), default="uploaded") # uploaded, processing, ready, error
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False)
    page_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)

    document = relationship("Document", back_populates="chunks")

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    filename = Column(String(255), nullable=False)
    storage_path = Column(Text, nullable=False)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    is_cleaned = Column(Boolean, default=False)
    status = Column(String(30), default="uploaded") # uploaded, cleaned, error
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="datasets")
    reports = relationship("Report", back_populates="dataset")

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=True)
    report_name = Column(String(200), nullable=False)
    category = Column(String(100), default="Executive MIS")
    file_path = Column(Text, nullable=False)
    file_size = Column(String(50), default="1.2 MB")
    generated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reports")
    dataset = relationship("Dataset", back_populates="reports")

class AutomationWorkflow(Base):
    __tablename__ = "automation_workflows"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    workflow_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    trigger_type = Column(String(50), default="schedule") # schedule, webhook, event
    schedule = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    last_run = Column(DateTime, nullable=True)
    execution_count = Column(Integer, default=0)

    logs = relationship("AutomationLog", back_populates="workflow", cascade="all, delete-orphan")

class AutomationLog(Base):
    __tablename__ = "automation_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workflow_id = Column(String(36), ForeignKey("automation_workflows.id"), nullable=True)
    workflow_name = Column(String(200), nullable=True)
    trigger_type = Column(String(50), default="schedule")
    execution_status = Column(String(30), default="success") # success, failed
    duration_ms = Column(Integer, default=0)
    details = Column(Text, nullable=True)
    executed_at = Column(DateTime, default=datetime.utcnow)

    workflow = relationship("AutomationWorkflow", back_populates="logs")

class Activity(Base):
    __tablename__ = "activities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

