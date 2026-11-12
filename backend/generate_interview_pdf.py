import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "ExecuMate AI — Technical Architecture & Interview Master Guide")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)
        
        # Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_str)
        self.drawString(54, 36, "CONFIDENTIAL & PROPRIETARY — PREPARED FOR TECHNICAL INTERVIEW PRESENTATION")
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)
        self.restoreState()


def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_primary = colors.HexColor("#1E3A8A")    # Deep Navy
    c_blue = colors.HexColor("#2563EB")       # Brand Blue
    c_dark = colors.HexColor("#0F172A")       # Charcoal Slate
    c_muted = colors.HexColor("#475569")      # Slate text
    c_bg_light = colors.HexColor("#F8FAFC")   # Box bg
    c_border = colors.HexColor("#CBD5E1")     # Border
    c_emerald = colors.HexColor("#059669")    # Green

    # Typography styles
    style_cover_title = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=c_primary,
        spaceAfter=6
    )
    style_cover_sub = ParagraphStyle(
        'CoverSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=c_blue,
        spaceAfter=14
    )
    style_badge = ParagraphStyle(
        'CoverBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )
    style_h1 = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )
    style_h2 = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=c_blue,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    style_body = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=c_dark,
        spaceAfter=6
    )
    style_body_bold = ParagraphStyle(
        'Body_Bold',
        parent=style_body,
        fontName='Helvetica-Bold'
    )
    style_bullet = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_dark,
        leftIndent=14,
        spaceAfter=3
    )
    style_code = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#0F172A")
    )
    style_box_text = ParagraphStyle(
        'Box_Text',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_dark
    )
    style_q_title = ParagraphStyle(
        'Q_Title',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=c_primary,
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True
    )

    story = []

    # =========================================================================
    # COVER / HEADER BANNER
    # =========================================================================
    badge_data = [[
        Paragraph("<b>EXECUTIVE AI &amp; REAL-TIME MIS OPERATIONS SUITE</b>", style_badge)
    ]]
    badge_table = Table(badge_data, colWidths=[504])
    badge_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_primary),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(badge_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("ExecuMate AI: Project Overview &amp; Python Technical Architecture", style_cover_title))
    story.append(Paragraph("A Comprehensive Engineering Blueprint, Python Utilization Guide &amp; Interview Presentation Playbook", style_cover_sub))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_blue, spaceBefore=0, spaceAfter=10))

    # Meta Quick Info Box
    meta_data = [
        [
            Paragraph("<b>Candidate Role:</b> Full Stack AI &amp; Python Engineer", style_box_text),
            Paragraph("<b>Target Audience:</b> Tech Lead, VP of Eng, Hiring Manager", style_box_text)
        ],
        [
            Paragraph("<b>Primary Backend:</b> Python 3.11+ / FastAPI / Pandas / PyMuPDF", style_box_text),
            Paragraph("<b>Primary Frontend:</b> React 18 / Vite / Tailwind CSS / Recharts", style_box_text)
        ],
        [
            Paragraph("<b>AI Orchestration:</b> Google Gemini 1.5 Pro / PyMuPDF RAG", style_box_text),
            Paragraph("<b>Persistence:</b> SQLite/PostgreSQL / IndexedDB (Client)", style_box_text)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[252, 252])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg_light),
        ('BOX', (0,0), (-1,-1), 0.5, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # =========================================================================
    # SECTION 1: 30-SECOND ELEVATOR PITCH & EXECUTIVE SUMMARY
    # =========================================================================
    story.append(Paragraph("1. Executive Summary &amp; 30-Second Elevator Pitch", style_h1))
    
    pitch_text = (
        "<b>ExecuMate AI</b> is an enterprise-grade Executive Assistant and real-time Management Information System (MIS) "
        "designed for C-suite leaders and operations directors. It seamlessly bridges raw business data (messy CSVs and Excels) "
        "and unstructured regulatory documents (multi-hundred-page PDFs) into actionable intelligence. "
        "On the backend, an asynchronous <b>Python FastAPI</b> engine orchestrates high-throughput statistical data cleaning (Pandas), "
        "document chunking and grounded Retrieval-Augmented Generation (PyMuPDF + Gemini 1.5 Pro), and automated Excel MIS generation. "
        "On the frontend, a reactive <b>React 18 + Vite</b> dashboard provides instant KPI slicing, intelligent charts that adapt to any schema, "
        "and client-side <b>IndexedDB persistence</b> to guarantee zero data loss without browser quota crashes."
    )
    story.append(Paragraph(pitch_text, style_body))
    story.append(Spacer(1, 8))

    # =========================================================================
    # SECTION 2: WHY PYTHON? COMPREHENSIVE JUSTIFICATION
    # =========================================================================
    story.append(Paragraph("2. Why Python? Deep-Dive Architectural Justification", style_h1))
    story.append(Paragraph(
        "A critical question in any technical interview is: <i>'Why did you build the backend in Python instead of Node.js, Go, or Java?'</i> "
        "Here are the four pillars that made Python the objectively superior choice for ExecuMate AI:",
        style_body
    ))

    python_reasons = [
        [
            Paragraph("<b>Python Capability</b>", style_body_bold),
            Paragraph("<b>Why Chosen Over Alternatives (Node/Go/Java)</b>", style_body_bold),
            Paragraph("<b>ExecuMate Implementation</b>", style_body_bold)
        ],
        [
            Paragraph("<b>Vectorized Data Cleaning &amp; Statistics</b><br/>(Pandas &amp; NumPy)", style_body),
            Paragraph("JavaScript/Node.js lacks true columnar memory structures and native C-level vectorized operations. Doing statistical imputation (mean, median, IQR outliers) in JS on 10,000+ rows causes event loop blocking and memory spikes.", style_body),
            Paragraph("<code>backend/app/services/data_cleaning.py</code> automatically detects column data types, removes duplicates, imputes missing cells, and computes a data quality audit score in under 20ms.", style_body)
        ],
        [
            Paragraph("<b>High-Performance Asynchronous API</b><br/>(FastAPI + Starlette + Uvicorn)", style_body),
            Paragraph("Combines Python's ease of development with near-Go/Node speed via async/await on ASGI. Auto-generates OpenAPI / Swagger interactive documentation, and provides strict runtime validation via Pydantic.", style_body),
            Paragraph("All I/O operations (file uploads, Gemini API queries, DB queries) are non-blocking, ensuring seamless concurrency under high user load.", style_body)
        ],
        [
            Paragraph("<b>Document Intelligence &amp; PDF Parsing</b><br/>(PyMuPDF / fitz)", style_body),
            Paragraph("Standard Node.js PDF parsers (like <code>pdf-parse</code>) frequently corrupt complex tables, multi-column layouts, and unicode. PyMuPDF is a fast C library binding with superior layout preservation.", style_body),
            Paragraph("<code>backend/app/routes/documents.py</code> extracts text with page offsets, chunks documents into grounded context, and feeds precise citations into Gemini LLM.", style_body)
        ],
        [
            Paragraph("<b>Automated Excel MIS Generation</b><br/>(openpyxl)", style_body),
            Paragraph("Enterprise reporting requires styled workbooks with custom column widths, number formats ($/%), and formula cells. Node libraries are prone to schema corruptions.", style_body),
            Paragraph("<code>backend/app/services/report_generator.py</code> creates branded, presentation-ready <code>.xlsx</code> deliverables with summary sheets.", style_body)
        ]
    ]

    py_table = Table(python_reasons, colWidths=[110, 204, 190])
    py_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light])
    ]))
    story.append(py_table)
    story.append(Spacer(1, 14))

    # Page Break for clean sectioning
    story.append(PageBreak())

    # =========================================================================
    # SECTION 3: SYSTEM ARCHITECTURE & DATA FLOW
    # =========================================================================
    story.append(Paragraph("3. End-to-End System Architecture", style_h1))
    story.append(Paragraph(
        "ExecuMate AI employs a modern decoupled architecture separating client presentation, edge caching, asynchronous API orchestration, and background workers.",
        style_body
    ))

    arch_box_data = [
        [
            Paragraph("<b>[LAYER 1: REACT 18 SPA CLIENT]</b><br/>"
                      "• <b>Vite &amp; Tailwind CSS:</b> Sub-second HMR and executive styling with zero CSS bloat.<br/>"
                      "• <b>Recharts &amp; Dynamic Profile Engine:</b> Automatically categorizes columns by cardinality (2-15 = discrete categorical; &gt;15 = continuous numeric).<br/>"
                      "• <b>IndexedDB Storage Adapter:</b> Replaced brittle 5MB localStorage with asynchronous IndexedDB, eliminating <code>QuotaExceededError</code> forever.", style_box_text)
        ],
        [
            Paragraph("↓ <i>HTTPS REST API (JSON / Multipart Form-Data / Streamed Responses)</i>", style_code)
        ],
        [
            Paragraph("<b>[LAYER 2: PYTHON FASTAPI ASYNC GATEWAY &amp; SERVICE LAYER]</b><br/>"
                      "• <b>FastAPI Router:</b> Endpoints for Analytics (<code>/api/data</code>), AI Research (<code>/api/documents</code>), Reports (<code>/api/reports</code>), and Automation (<code>/api/automation</code>).<br/>"
                      "• <b>Pandas Engine:</b> Ingestion of <code>.csv</code>, <code>.xlsx</code>, <code>.xls</code>, automated null imputation (auto/mean/median/max), duplicate removal.<br/>"
                      "• <b>PyMuPDF RAG Pipeline:</b> Ingests enterprise PDFs, extracts structured text chunks, and computes keyword-indexed citations.<br/>"
                      "• <b>Google Gemini 1.5 Pro:</b> Contextual prompt injection with grounding guardrails to eliminate hallucinations.", style_box_text)
        ],
        [
            Paragraph("↓ <i>SQLAlchemy ORM + Local/Managed Storage</i>", style_code)
        ],
        [
            Paragraph("<b>[LAYER 3: PERSISTENCE &amp; CLOUD DEPLOYMENT]</b><br/>"
                      "• <b>Relational DB:</b> SQLite in development; PostgreSQL on Render in production.<br/>"
                      "• <b>Foreign Key Guard:</b> Safe report unlinking to prevent integrity crashes on dataset deletion.<br/>"
                      "• <b>Server &amp; Host Binding:</b> Node custom production static server (<code>0.0.0.0:$PORT</code>) and Uvicorn ASGI server.", style_box_text)
        ]
    ]

    arch_table = Table(arch_box_data, colWidths=[504])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg_light),
        ('BOX', (0,0), (-1,-1), 1, c_blue),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 4: CORE MODULES BREAKDOWN
    # =========================================================================
    story.append(Paragraph("4. Core Functional Modules &amp; Engineering Highlights", style_h1))

    modules = [
        ("A. MIS & Data Analytics Engine", [
            "<b>Multi-Format Ingestion:</b> Supports CSV and Excel with automatic encoding detection and comma/delimiter parsing.",
            "<b>Automated Cleaning & Null Imputation:</b> Identifies numeric vs string columns. Replaces nulls using statistical strategies (mean, median, max, or auto-heuristic) while logging exact imputation audit trails.",
            "<b>Universal Adaptive Visualizations:</b> Evaluates dataset cardinality. Low-cardinality numbers (e.g. <code>sex: 0/1</code>, <code>target: 0/1</code>, <code>cp: 0-3</code>) are recognized as categorical grouping slices, preventing blank charts on ML datasets.",
            "<b>Reliable Slicer:</b> Reactive multi-select filtering that updates all 4 KPI cards and 4 distinct business charts simultaneously."
        ]),
        ("B. AI Research Assistant & Document Q&A (RAG)", [
            "<b>Grounded Document Q&A:</b> Users upload regulatory PDFs or corporate filings. PyMuPDF extracts full text with page-number offsets.",
            "<b>Hallucination Prevention:</b> Prompts strictly constrain the Gemini LLM to answer only from indexed document chunks, returning verbatim page citations.",
            "<b>Dataset Cross-Talk:</b> Uploaded CSVs are automatically summarized into insight documents so executives can chat with their tabular data in natural language."
        ]),
        ("C. Strategic Projects & Task Sync", [
            "<b>Automated Task Generation:</b> Uploading a dataset automatically extracts actionable items (e.g. audit tasks, defect reviews, procurement renegotiations) and syncs them into the Projects kanban.",
            "<b>Bidirectional Status Updates:</b> Completed tasks recalculate project progress percentages in real time."
        ]),
        ("D. Automated Executive Reporting", [
            "<b>Excel MIS Deliverables:</b> Generates branded multi-tab workbooks using <code>openpyxl</code> with summary KPIs, cleaned records, and imputation audit logs.",
            "<b>Instant Browser Download:</b> Streams generated Excel files directly to the browser with correct MIME headers."
        ])
    ]

    for title, points in modules:
        story.append(Paragraph(title, style_h2))
        for p in points:
            story.append(Paragraph(f"• {p}", style_bullet))
        story.append(Spacer(1, 4))

    # Page Break for Interview Questions
    story.append(PageBreak())

    # =========================================================================
    # SECTION 5: TOP 10 INTERVIEW QUESTIONS & MODEL ANSWERS
    # =========================================================================
    story.append(Paragraph("5. Top 10 Technical Interview Questions &amp; Battle-Tested Answers", style_h1))
    story.append(Paragraph(
        "Use these structured answers when the interviewer asks about design choices, technical trade-offs, and debugging war stories:",
        style_body
    ))

    interview_qa = [
        (
            "Q1. 'Can you walk me through the high-level architecture of your project?'",
            "<b>Answer:</b> ExecuMate AI is an executive MIS and AI intelligence platform built with a React 18 / Vite frontend and a Python FastAPI backend. The frontend handles interactive KPI exploration, dynamic slicers, and SVG visualizations via Recharts. The backend orchestrates data ingestion and Pandas-driven data cleaning, PyMuPDF document extraction, Google Gemini RAG question-answering, and openpyxl Excel report generation. To guarantee performance, client-side persistence uses an asynchronous IndexedDB adapter to avoid browser storage quota crashes, while the backend maintains relational integrity using SQLAlchemy."
        ),
        (
            "Q2. 'Why did you choose FastAPI over Flask or Django?'",
            "<b>Answer:</b> I selected FastAPI for three key reasons: First, <b>native asynchronous support</b>. Our application handles high-latency operations—like querying Google's Gemini LLM and parsing multi-megabyte PDFs—where async/await prevents worker blocking. Second, <b>Pydantic validation</b> gives us automatic request/response schema validation and compile-time type safety. Third, <b>automatic OpenAPI/Swagger generation</b> speeds up frontend-backend contract testing. Django was too heavyweight for our decoupled React architecture, and Flask lacks native async and modern type validation out of the box."
        ),
        (
            "Q3. 'How does your data cleaning and null-imputation pipeline work under the hood?'",
            "<b>Answer:</b> In <code>data_cleaning.py</code>, we ingest the uploaded tabular file into a Pandas DataFrame. We first deduplicate identical rows while preserving initial row counts. Next, we scan every column for missing, null, or NaN values. For numeric columns, our algorithm computes statistical imputation based on the chosen strategy: 'mean' for normal distributions, 'median' for skewed datasets with outliers, or 'auto' which assesses skewness before selecting. Categorical columns default to mode or 'Unknown'. Crucially, we build an <i>Imputation Audit Trail</i> that details exactly how many cells were changed in each column and which values were substituted, providing 100% auditability for executive stakeholders."
        ),
        (
            "Q4. 'What was the toughest browser storage bug you encountered, and how did you resolve it?'",
            "<b>Answer:</b> When users uploaded datasets with 800+ rows, the application would reset to empty on page refresh. I diagnosed that the dataset was being serialized into <code>window.localStorage</code>, which has a strict ~5MB origin limit. Once breached, browsers throw a silent <code>QuotaExceededError</code>. I solved this by engineering an <b>asynchronous IndexedDB storage layer</b> (<code>datasetStorage.js</code>). IndexedDB operates asynchronously, has hundreds of megabytes of available quota, and does not block the UI thread. As a resilient fallback, we also added a backend sync endpoint (<code>GET /api/data/latest</code>) so that even if local cache is cleared, the session restores instantly."
        ),
        (
            "Q5. 'How did you solve the issue where machine learning datasets like heart_disease.csv rendered blank charts?'",
            "<b>Answer:</b> Classical business datasets have explicit text columns like 'Region' or 'Category' to group by. However, ML datasets (like heart disease or Titanic) encode categories as numeric codes (e.g., <code>sex: 0/1</code>, <code>target: 0/1</code>, <code>cp: 0,1,2,3</code>). Our initial chart generator only looked for string columns, so it found 0 categories and rendered blank charts. I engineered a <b>cardinality-based classification heuristic</b>: columns with distinct non-null counts between 2 and 15 are classified as discrete categorical dimensions. We map these codes to human-readable labels (e.g. <code>sex: 1 -> Male (1)</code>) and reserve high-cardinality columns (&gt;15) for continuous metric aggregation. This allows any arbitrary dataset to render stunning, insightful charts automatically."
        ),
        (
            "Q6. 'How does the Retrieval-Augmented Generation (RAG) system work in your document research assistant?'",
            "<b>Answer:</b> When an executive uploads a PDF (e.g. an earnings report or compliance brief), <b>PyMuPDF</b> extracts the document text, splits it into semantically coherent chunks, and indexes them with page metadata. When a user asks a question, our backend performs relevance retrieval over the document chunks. We then inject the retrieved chunks into a strictly constrained Gemini 1.5 Pro prompt that instructs the LLM: <i>'Answer solely using the provided context. If unknown, state unverified. Return exact page citations.'</i> This eliminates LLM hallucinations and provides grounded, verifiable executive answers."
        ),
        (
            "Q7. 'How do you handle relational database integrity and foreign key constraints on deletion?'",
            "<b>Answer:</b> In our SQLAlchemy schema, the <code>Report</code> model has a nullable foreign key pointing to <code>Dataset.id</code>. Initially, deleting a dataset that had generated a report caused an <code>IntegrityError</code> because child reports still referenced the parent dataset ID. I updated the <code>delete_dataset</code> route to unlink all associated reports (<code>update Report set dataset_id = None</code>) before deleting the dataset record and unlinking the physical file on disk. This preserves report history while allowing clean dataset removals."
        ),
        (
            "Q8. 'How do you deploy this application and solve Render port scan timeouts?'",
            "<b>Answer:</b> On Render, container instances dynamically inject an environment variable <code>$PORT</code> (usually port 10000). A common deployment error is binding to <code>localhost</code> (127.0.0.1) instead of <code>0.0.0.0</code>, which prevents Render's reverse proxy from detecting open ports. For the frontend static build, I created a lightweight Node server (<code>server.js</code>) that explicitly listens on <code>0.0.0.0:process.env.PORT</code>, serving SPA fallback routes (200 on index.html for React Router). For the backend, Uvicorn runs with <code>--host 0.0.0.0 --port $PORT</code> with CORS middleware allowing the production frontend origin."
        ),
        (
            "Q9. 'How would you scale this system to handle 100,000 concurrent users?'",
            "<b>Answer:</b> In scaling up: First, offload heavy Pandas data processing and PDF chunking from the web process to a <b>Celery / Redis background worker queue</b>. Second, migrate the database from SQLite to a managed <b>PostgreSQL instance with PgBouncer</b> connection pooling. Third, replace on-disk document storage with <b>Amazon S3 or Google Cloud Storage</b> using presigned URLs. Fourth, integrate a <b>vector database like pgvector or Qdrant</b> for dense semantic embedding search instead of in-memory chunk filtering. Fifth, containerize with Docker and deploy on Kubernetes or AWS ECS with auto-scaling."
        ),
        (
            "Q10. 'What demonstrates your commitment to clean code and production engineering in this project?'",
            "<b>Answer:</b> Real-world production engineering is about anticipating edge cases: handling storage quotas gracefully, designing resilient schema mappings for unpredictable user uploads, validating API contracts with Pydantic, enforcing audit trails on transformed data, and eliminating silent errors through toast notifications and comprehensive logs. Everything in ExecuMate AI is designed with defensive programming and executive usability in mind."
        )
    ]

    for q, a in interview_qa:
        q_box = [
            [Paragraph(q, style_q_title)],
            [Paragraph(a, style_body)]
        ]
        q_table = Table(q_box, colWidths=[504])
        q_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), c_bg_light),
            ('BOX', (0,0), (-1,-1), 0.5, c_border),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(q_table)
        story.append(Spacer(1, 6))

    # =========================================================================
    # SECTION 6: SUMMARY CHECKLIST FOR THE INTERVIEW
    # =========================================================================
    story.append(Spacer(1, 10))
    story.append(Paragraph("6. Quick Interview Checklist: Key Terms to Highlight", style_h1))
    
    checklist_data = [
        [Paragraph("<b>Category</b>", style_body_bold), Paragraph("<b>Key Technical Keywords &amp; Concepts</b>", style_body_bold)],
        [
            Paragraph("<b>Backend &amp; Python</b>", style_body),
            Paragraph("FastAPI, Uvicorn, ASGI, Pandas, NumPy, Vectorized Imputation, PyMuPDF (fitz), openpyxl, SQLAlchemy ORM, Pydantic Type Validation, Async I/O, CORS Middleware.", style_body)
        ],
        [
            Paragraph("<b>Frontend &amp; UX</b>", style_body),
            Paragraph("React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Adaptive Cardinality Heuristic, IndexedDB Asynchronous Storage, ResponsiveContainer.", style_body)
        ],
        [
            Paragraph("<b>AI &amp; Data Science</b>", style_body),
            Paragraph("Google Gemini 1.5 Pro, Retrieval-Augmented Generation (RAG), Grounding &amp; Citations, Prompt Engineering, Hallucination Prevention, Imputation Audit Trail.", style_body)
        ],
        [
            Paragraph("<b>DevOps &amp; Architecture</b>", style_body),
            Paragraph("0.0.0.0 Host Binding, Dynamic $PORT resolution, SPA Fallback Routing, GitHub Actions / Render CI/CD, Storage Quota Optimization.", style_body)
        ]
    ]

    check_table = Table(checklist_data, colWidths=[120, 384])
    check_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light])
    ]))
    story.append(check_table)

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"SUCCESS: Generated PDF at {filename}")

if __name__ == "__main__":
    out_path = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "ExecuMate_AI_Python_Architecture_and_Interview_Guide.pdf")
    build_pdf(out_path)
