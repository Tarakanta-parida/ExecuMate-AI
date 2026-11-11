# ExecuMate AI — Application Flow (APP_FLOW.md)

## 1. Primary User Journey
1. **Application Launch & Authentication (`/login`)**:
   - Secure login via corporate email & password.
   - 1-Click Demo Persona selector to evaluate Director, Manager, Analyst, and Research Assistant perspectives.
2. **Executive Dashboard (`/`)**:
   - Immediate visibility into key portfolio KPIs: Active Projects, Pending Tasks, Overdue alerts, and Generated MIS Reports.
   - Interactive Weekly Performance charts (velocity of tasks vs MIS generation).
   - Direct shortcuts to "Clean my data", "Ask AI", and "Create report".
3. **AI Research Assistant (`/research`)**:
   - Upload PDF policy briefs, regulatory papers, and financial audits.
   - Automatic PyMuPDF parsing and vector indexing.
   - View AI executive summary, key findings, and risk recommendations.
   - Conversational grounded Q&A with verifiable page citations.
4. **MIS & Data Analytics Engine (`/analytics`)**:
   - Upload raw Excel / CSV files.
   - Instant audit of null values and duplicate records.
   - Trigger "Clean my data" to impute missing cells and deduplicate rows.
   - Review updated KPIs and generate a downloadable Excel MIS report.
5. **Projects & Task Management (`/tasks`)**:
   - Organize deliverables into strategic business projects.
   - Toggle between Table and Kanban views.
   - Create new tasks, assign team members, and flag overdue deadlines.
6. **Workflow Automation Center (`/automation`)**:
   - Monitor scheduled recurring MIS emails and deadline notifications.
   - Trigger instant execution via simulated n8n webhook.
   - Review execution history logs and runtime performance.
7. **Reports & Executive Insights (`/reports`)**:
   - Browse catalog of generated Excel and PDF deliverables.
   - One-click downloads.

