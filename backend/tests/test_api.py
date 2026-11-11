import pytest
import os
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_auth_login():
    response = client.post("/api/auth/login", json={
        "email": "sarah.jenkins@execumate.ai",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["full_name"] == "Sarah Jenkins"

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert data["kpis"]["total_projects"] >= 1
    assert "weekly_performance" in data

def test_projects_crud():
    # 1. List
    list_res = client.get("/api/projects")
    assert list_res.status_code == 200
    
    # 2. Create
    create_res = client.post("/api/projects", json={
        "project_name": "Test Project Automated",
        "description": "Integration test created project",
        "status": "active",
        "progress": 10
    })
    assert create_res.status_code == 200
    created_id = create_res.json()["id"]
    assert created_id is not None

def test_tasks_crud():
    # 1. Create task
    create_res = client.post("/api/tasks", json={
        "title": "Automated Unit Test Task",
        "description": "Verify task creation works cleanly",
        "priority": "high",
        "status": "pending",
        "due_date": "2026-11-20"
    })
    assert create_res.status_code == 200
    task_id = create_res.json()["id"]

    # 2. Update task
    update_res = client.patch(f"/api/tasks/{task_id}", json={
        "status": "completed"
    })
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "completed"

def test_reports_generation_and_deletion():
    # 1. Generate report
    gen_res = client.post("/api/reports/generate", json={
        "report_name": "Test_Automated_MIS.xlsx",
        "category": "Testing"
    })
    assert gen_res.status_code == 200
    report_id = gen_res.json()["id"]
    file_path = gen_res.json()["file_path"]

    # 2. Delete report
    del_res = client.delete(f"/api/reports/{report_id}")
    assert del_res.status_code == 200
    assert del_res.json()["message"] == "Report deleted successfully"

def test_automation_workflow_and_logs():
    # 1. List workflows
    wf_res = client.get("/api/automation/workflows")
    assert wf_res.status_code == 200
    wfs = wf_res.json()
    assert len(wfs) >= 1

    # 2. Trigger workflow
    trigger_res = client.post("/api/automation/trigger", json={
        "workflow_id": wfs[0]["id"]
    })
    assert trigger_res.status_code == 200
    assert trigger_res.json()["execution_status"] == "success"

    # 3. Read logs
    logs_res = client.get("/api/automation/logs")
    assert logs_res.status_code == 200
    assert len(logs_res.json()) >= 1

