# ExecuMate AI — Executive Business Productivity & Intelligence Platform

ExecuMate AI is an all-in-one executive productivity platform designed to reduce manual administrative and analytical workloads by bringing **business reporting, AI-assisted research, document intelligence, MIS data analytics, and task coordination** into one unified application.

---

## 🌟 Core Modules

1. **Executive Dashboard (`Module 01`)**
   - High-level KPI monitoring: Active Projects, Pending Tasks, Overdue Assignments Alert, Generated MIS Reports.
   - Interactive Weekly Performance & Velocity charts (Tasks completed vs Reports generated).
   - Real-time project health & portfolio progress tracking.

2. **AI Research Assistant & Document Intelligence (`Module 02`)**
   - PDF document ingestion & chunking via PyMuPDF.
   - Executive AI summarization, key takeaway extraction, and risk recommendations.
   - Grounded Q&A with verifiable page-level citations (`[p. 14]`, `[p. 22]`) to eliminate hallucinations.

3. **MIS & Data Analytics Engine (`Module 03`)**
   - Ingest CSV and Excel spreadsheets via Pandas.
   - Automated data quality audit: duplicate detection, missing cell imputation, and type standardization.
   - Dynamic KPI calculation: Total Revenue, Average Gross Margin %, Units Sold, Enterprise Revenue share.
   - One-click "Clean my data" and "Create report" generation.

4. **Projects & Task Management (`Module 04`)**
   - Cross-functional project roadmap tracking with target deadlines.
   - Table and Kanban board views with priority badges (High, Medium, Low).
   - Proactive overdue task warnings and 1-click status transitions.

5. **Workflow Automation Center (`Module 05`)**
   - Orchestrated recurring reports and approaching deadline alerts.
   - Webhook triggers integrated with n8n workflow engine.
   - Persistent execution history logs with latency telemetry and audit details.

6. **Reports & Executive Insights**
   - Central catalog of generated Excel (`.xlsx`) and PDF deliverables.
   - Instant file preview and download.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 (Vite), Tailwind CSS | Fast, clean, responsive executive UI |
| **Icons & Charts**| Lucide React, Recharts | Professional data visualizations |
| **Backend** | Python 3.11+, FastAPI | High-performance REST APIs |
| **Data Processing** | Pandas, NumPy, OpenPyXL | Spreadsheet cleaning & report creation |
| **Document Processing**| PyMuPDF (fitz) | High-fidelity PDF text extraction |
| **Database** | PostgreSQL / SQLite + SQLAlchemy | Relational persistence & vector storage |
| **Workflow Automation**| n8n Webhooks | Scheduled cron execution and email alerts |

---

## 🚀 Quick Start Guide

### 1. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Interactive API documentation is accessible at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## 👥 Persona Demonstration Mode

ExecuMate AI includes an instant **Persona Switcher** in the sidebar:
- **Director (Sarah Jenkins)**: Executive portfolio oversight and board summaries.
- **Manager (David Ross)**: Task delegation, milestone tracking, and team alerts.
- **Data Analyst (Priya Sharma)**: Ingestion, cleansing, and MIS report creation.
- **Research Assistant (Michael Chang)**: Document research, citations, and risk synthesis.

