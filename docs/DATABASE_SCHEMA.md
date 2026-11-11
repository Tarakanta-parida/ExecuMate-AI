# ExecuMate AI — Database Schema Document

## 1. Relational Database: PostgreSQL (`execumate_db`)

### Core Tables
1. **users**: User identities, roles (director, manager, analyst, research_assistant), departments, password hashes.
2. **projects**: Strategic business initiatives, start/end dates, progress percentage, owner FK.
3. **tasks**: Specific actionable deliverables, project FK, assignee FK, priority (high, medium, low), status (pending, in_progress, completed), due date.
4. **documents**: Uploaded PDF files, storage locations, page count, executive summaries.
5. **document_chunks**: Extracted text sections per page with vector embedding columns (`vector(768)`).
6. **datasets**: Ingested raw Excel/CSV spreadsheets, row/column counts, cleaning flags.
7. **reports**: Generated MIS deliverables (`.xlsx`, `.pdf`), file paths, download tracking.
8. **automation_workflows**: n8n workflow triggers, cron schedules, active toggles.
9. **automation_logs**: Audit trail of automated executions, duration ms, status, error details.
10. **activities**: User activity stream for audit compliance.

