# ExecuMate AI — Demonstration & Presentation Guide

This guide walks through the **three essential business demonstrations** highlighted in Section 8 of the PRD.

---

## 🎯 Demo 1: MIS Data Processing & Automated Reporting
**Business Problem Solved**: Replaces hours of manual spreadsheet auditing, formula reconciliation, and repetitive monthly report formatting.

1. **Navigate to MIS & Data Analytics**:
   - Click **Data Analytics** in the sidebar (or click *"Clean my data"* on the Dashboard).
2. **Review the Ingested Dirty Dataset**:
   - Notice the dataset banner: `regional_sales_q4_uncleaned.csv` is flagged with a yellow badge: `RAW / DIRTY DATASET`.
   - Point out the initial audit metrics: **1 duplicate row detected** (`#1007` duplicating `#1006`), **3 missing cells** (Units, Cost, Margin for LATAM and APAC rows), and an initial quality score of **84.2%**.
3. **Execute 1-Click Cleansing**:
   - Click the blue **"Clean my data"** button.
   - Watch the dataset update in real time:
     - Quality Score elevates to **99.8%**.
     - Badge shifts to green `CLEANSED & AUDITED`.
     - Duplicates are purged, numerical gaps imputed with statistical medians, and whitespace trimmed.
     - Dynamic KPIs (Total Revenue, Avg Margin %, Units Sold, Enterprise Share) instantly refresh.
4. **Generate the Formatted Excel MIS Report**:
   - Click **"Create report"**.
   - Notice the green toast confirmation: Report registered.
5. **View & Manage in Reports**:
   - Navigate to **Reports** in the sidebar.
   - Point out the newly created Excel MIS deliverable.
   - Click **Download** to stream the binary spreadsheet or **Delete** (with safety confirmation) to clean up.

---

## 🤖 Demo 2: AI Document Intelligence & Grounded Research
**Business Problem Solved**: Eliminates the bottleneck of manually reading 40–100 page PDF policy consultations and regulatory compliance filings.

1. **Navigate to AI Research**:
   - Click **AI Research** in the sidebar.
2. **Upload & Vector Indexing**:
   - Click **"Upload PDF"** and select `sample_data/Enterprise_AI_Strategy_Brief.pdf` (or any PDF file).
   - Watch the document parse with PyMuPDF and register as indexed in pgvector.
3. **Review AI Executive Synthesis**:
   - Point to the right-hand **Executive Insights** panel:
     - Auto-generated **Executive Summary**.
     - **Key Findings** bullet points.
     - Numbered **Actionable Recommendations**.
4. **Conversational Grounded Q&A**:
   - Click one of the quick prompt chips or type:
     *"What liquidity buffer does the document advise management to maintain?"*
   - Hit **"Ask AI"**.
   - Highlight the verifiable citation card generated beneath the response:
     - Cites exact page and section (e.g. `[Page 6: Executive Summary]`).
     - Demonstrates zero hallucinations: The answer is strictly anchored in document text.

---

## 📋 Demo 3: Strategic Projects & Task Coordination
**Business Problem Solved**: Prevents overdue deadlines and misalignment between executive directors and operational project managers.

1. **Persona Demonstration**:
   - In the sidebar bottom widget, switch to **"Director (Sarah Jenkins)"**.
   - Point to the Executive Dashboard: Overdue task alerts are immediately surfaced at the top.
2. **Review Open Tasks**:
   - Click **Projects & Tasks** in the sidebar.
   - Toggle between **Table View** and **Kanban Board** (`To Do`, `In Progress`, `Completed`).
   - Notice the high-priority overdue badge on overdue assignments.
3. **Create a Milestone & Task**:
   - Click **"Add Task"**.
   - Enter title: `Audit Q3 Cloud Infrastructure Licensing`.
   - Set priority to `High`, assignee to `David Ross`, and set due date.
   - Click **Create Task** — the assignment is live and synced.
4. **Resolve & Update**:
   - Click the status dropdown or click **"Mark Done"**.
   - Return to the **Dashboard** and observe the pending tasks counter decrement and the weekly velocity curve reflect the completion.

---

## ⚡ Demo 4: Workflow Automation Center
1. Navigate to **Automation** in the sidebar.
2. Review the pre-configured n8n workflows (`Daily Executive MIS Summary`, `Overdue Task Alert`).
3. Click **"Run Now"** on any workflow:
   - Dispatches webhook payload.
   - Displays execution duration in milliseconds (e.g. `340ms`).
   - Writes an immutable record to the PostgreSQL audit log table.

