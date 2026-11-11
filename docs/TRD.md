# ExecuMate AI — Technical Requirements Document (TRD)

## 1. System Architecture
```
                  ┌───────────────────────────────────────────────┐
                  │          ExecuMate React 18 (Vite)            │
                  │   Tailwind CSS • Recharts • Lucide Icons      │
                  └───────────────────────┬───────────────────────┘
                                          │ REST API / Axios
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │          FastAPI Application Server           │
                  │  Auth • Dashboard • Projects • Analytics • RAG│
                  └──────┬─────────────────┬──────────────────────┘
                         │                 │
         ┌───────────────▼──┐       ┌──────▼──────────────────────┐
         │ PostgreSQL/SQLite│       │      External / Pipelines   │
         │ Relational Tables│       │ PyMuPDF (PDF Parser)        │
         │ pgvector Store   │       │ Pandas & OpenPyXL (MIS)     │
         │ Execution Logs   │       │ n8n Webhook Automation      │
         └──────────────────┘       └─────────────────────────────┘
```

## 2. API Endpoints
- `POST /api/auth/login`: Authenticate corporate user & return session token.
- `GET /api/dashboard/summary`: High-level portfolio KPIs and velocity metrics.
- `GET /api/projects` & `POST /api/projects`: Project portfolio management.
- `GET /api/tasks` & `POST /api/tasks` & `PATCH /api/tasks/{id}`: Task operations.
- `POST /api/documents/upload`: PDF ingestion, text extraction & vector indexing.
- `POST /api/documents/{id}/summarize`: Executive AI briefing generator.
- `POST /api/documents/{id}/ask`: Context-grounded Q&A with verifiable citations.
- `POST /api/data/upload`: Ingest raw CSV/Excel spreadsheets.
- `POST /api/data/{id}/clean`: Deduplicate, impute nulls, and standardize data.
- `POST /api/reports/generate`: Create formatted `.xlsx` reports via OpenPyXL.
- `GET /api/reports/{id}/download`: Stream binary Excel report file to client.
- `POST /api/automation/trigger`: Dispatch n8n webhook workflow execution.
- `GET /api/automation/logs`: Retrieve audit telemetry and execution latency.

