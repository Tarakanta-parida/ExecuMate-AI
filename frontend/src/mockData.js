export const mockUsers = [
  {
    id: "usr-01",
    name: "Sarah Jenkins",
    email: "sarah.jenkins@execumate.ai",
    role: "Director",
    department: "Executive Board",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    initials: "SJ"
  },
  {
    id: "usr-02",
    name: "David Ross",
    email: "david.ross@execumate.ai",
    role: "Manager",
    department: "Operations & Delivery",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    initials: "DR"
  },
  {
    id: "usr-03",
    name: "Priya Sharma",
    email: "priya.sharma@execumate.ai",
    role: "Data Analyst",
    department: "MIS & Analytics",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    initials: "PS"
  },
  {
    id: "usr-04",
    name: "Michael Chang",
    email: "michael.chang@execumate.ai",
    role: "Research Assistant",
    department: "Strategic Intelligence",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    initials: "MC"
  }
];

export const mockDashboardKPIs = {
  totalProjects: 12,
  totalProjectsChange: "+8% vs last month",
  completedTasks: 84,
  pendingTasks: 28,
  overdueTasks: 3,
  recentReportsCount: 47,
  dataQualityScore: "98.4%",
  aiSummariesGenerated: 156
};

export const mockWeeklyPerformance = [
  { day: "Mon", tasksDone: 14, reportsGenerated: 6, dataCleaned: 4 },
  { day: "Tue", tasksDone: 18, reportsGenerated: 9, dataCleaned: 7 },
  { day: "Wed", tasksDone: 15, reportsGenerated: 8, dataCleaned: 5 },
  { day: "Thu", tasksDone: 22, reportsGenerated: 12, dataCleaned: 9 },
  { day: "Fri", tasksDone: 19, reportsGenerated: 10, dataCleaned: 6 },
  { day: "Sat", tasksDone: 8, reportsGenerated: 3, dataCleaned: 2 },
  { day: "Sun", tasksDone: 5, reportsGenerated: 2, dataCleaned: 1 }
];

export const mockProjectStatusBreakdown = [
  { name: "On Track", value: 7, color: "#16A34A" },
  { name: "At Risk", value: 3, color: "#D97706" },
  { name: "Behind", value: 2, color: "#DC2626" },
  { name: "Completed", value: 4, color: "#2563EB" }
];

export const mockProjects = [
  {
    id: "proj-1",
    name: "Q4 Strategic Expansion & M&A",
    owner: "Sarah Jenkins",
    status: "active",
    progress: 75,
    startDate: "2026-10-01",
    dueDate: "2026-12-15",
    description: "Executive due diligence and market entry analysis across EMEA territory.",
    tasksTotal: 18,
    tasksCompleted: 14
  },
  {
    id: "proj-2",
    name: "Enterprise Cloud & Lakehouse Migration",
    owner: "David Ross",
    status: "active",
    progress: 42,
    startDate: "2026-09-15",
    dueDate: "2026-12-30",
    description: "Consolidating legacy SQL Server data warehouses into unified BigQuery lakehouse.",
    tasksTotal: 24,
    tasksCompleted: 10
  },
  {
    id: "proj-3",
    name: "APAC Supply Chain Resiliency",
    owner: "David Ross",
    status: "at_risk",
    progress: 28,
    startDate: "2026-10-10",
    dueDate: "2026-11-20",
    description: "Mitigating vendor lead-time bottlenecks and setting up automated stock alerts.",
    tasksTotal: 14,
    tasksCompleted: 4
  },
  {
    id: "proj-4",
    name: "Annual ESG Compliance & Audit 2026",
    owner: "Sarah Jenkins",
    status: "active",
    progress: 90,
    startDate: "2026-08-01",
    dueDate: "2026-11-18",
    description: "Carbon footprint reporting, board audit signoff, and external certification.",
    tasksTotal: 12,
    tasksCompleted: 11
  }
];

export const mockTasks = [
  {
    id: "task-101",
    projectId: "proj-1",
    projectName: "Q4 Strategic Expansion & M&A",
    title: "Reconcile October Tier-1 Vendor Invoices",
    description: "Verify statement differences against purchase orders in ERP and highlight variances > $5k.",
    priority: "high",
    status: "pending",
    assignedTo: "Priya Sharma",
    dueDate: "2026-11-12",
    isOverdue: false
  },
  {
    id: "task-102",
    projectId: "proj-2",
    projectName: "Enterprise Cloud & Lakehouse Migration",
    title: "Analyze Regional Sales Variances (APAC vs EMEA)",
    description: "Compute YoY delta for hardware margins and publish MIS summary.",
    priority: "medium",
    status: "in_progress",
    assignedTo: "David Ross",
    dueDate: "2026-11-15",
    isOverdue: false
  },
  {
    id: "task-103",
    projectId: "proj-1",
    projectName: "Q4 Strategic Expansion & M&A",
    title: "Synthesize Federal Reserve Regulatory Risk Brief",
    description: "Extract liquidity ratios and capital requirement mandates from the 120-page consultation doc.",
    priority: "high",
    status: "pending",
    assignedTo: "Michael Chang",
    dueDate: "2026-11-09",
    isOverdue: true
  },
  {
    id: "task-104",
    projectId: "proj-3",
    projectName: "APAC Supply Chain Resiliency",
    title: "Review Singapore Port Transshipment Delays",
    description: "Identify carrier dwell times exceeding 48 hours for Q3 shipments.",
    priority: "high",
    status: "pending",
    assignedTo: "David Ross",
    dueDate: "2026-11-08",
    isOverdue: true
  },
  {
    id: "task-105",
    projectId: "proj-4",
    projectName: "Annual ESG Compliance & Audit 2026",
    title: "Finalize Scope 1 & 2 Emissions Audit Signoff",
    description: "Executive presentation with third-party verification letter attached.",
    priority: "medium",
    status: "completed",
    assignedTo: "Sarah Jenkins",
    dueDate: "2026-11-10",
    isOverdue: false
  },
  {
    id: "task-106",
    projectId: "proj-2",
    projectName: "Enterprise Cloud & Lakehouse Migration",
    title: "Deploy Data Quality Cleanse Routine to Staging",
    description: "Run automated null-checks, duplicate resolution, and schema conformance tests.",
    priority: "low",
    status: "completed",
    assignedTo: "Priya Sharma",
    dueDate: "2026-11-07",
    isOverdue: false
  }
];

export const mockDocuments = [
  {
    id: "doc-1",
    title: "Global_Economic_Outlook_Q4_2026.pdf",
    size: "3.4 MB",
    pages: 42,
    uploadedAt: "2026-11-08 14:20",
    uploadedBy: "Michael Chang",
    status: "ready",
    summary: "This report analyzes macro headwinds, interest rate stabilization in major OECD economies, and forecasted enterprise tech spending growth of 7.2% through 2027. Highlights include key risks around regional supply chain fragmentation and recommended defensive liquidity buffers of 18-22%.",
    keyPoints: [
      "Interest rates expected to level off in Q1 2027.",
      "Enterprise IT capital expenditure growing by 7.2% YoY.",
      "Supply chain concentration risk in Southeast Asia remains elevated.",
      "Corporate cash reserves advised to exceed 18% of operating expenses."
    ],
    recommendations: [
      "Accelerate AI workflow automation to offset 4.5% projected wage growth.",
      "Diversify Tier-2 supplier contracts to mitigate single-corridor disruptions.",
      "Lock in medium-term debt facilities ahead of next quarter's treasury review."
    ]
  },
  {
    id: "doc-2",
    title: "Enterprise_Cybersecurity_Compliance_Audit.pdf",
    size: "2.1 MB",
    pages: 28,
    uploadedAt: "2026-11-05 09:15",
    uploadedBy: "Sarah Jenkins",
    status: "ready",
    summary: "Comprehensive SOC2 Type II and ISO 27001 readiness evaluation. All critical controls passed with zero high-severity vulnerabilities. Three medium findings related to access review frequency and third-party vendor MFA enforcement require remediation by December.",
    keyPoints: [
      "Passed 94 out of 97 automated security control assertions.",
      "Zero critical or high-severity CVEs identified across all production workloads.",
      "Vendor MFA compliance currently stands at 89% (target 100%)."
    ],
    recommendations: [
      "Mandate FIDO2 hardware keys for all infrastructure administrator accounts.",
      "Automate quarterly user de-provisioning audits via Okta webhook."
    ]
  },
  {
    id: "doc-3",
    title: "Q3_Consolidated_Financial_Statements.pdf",
    size: "5.8 MB",
    pages: 64,
    uploadedAt: "2026-11-02 17:40",
    uploadedBy: "Priya Sharma",
    status: "ready",
    summary: "Third-quarter revenue reached $48.2M (+14% YoY) with an EBITDA margin of 24.6%. Operating cash flow improved significantly to $12.1M driven by automated receivable collection and streamlined SaaS vendor licensing.",
    keyPoints: [
      "Net revenue grew to $48.2M beating market guidance by 3.4%.",
      "EBITDA margin expanded 180 bps to 24.6%.",
      "Days Sales Outstanding (DSO) dropped from 44 days to 36 days."
    ],
    recommendations: [
      "Reinvest $3M surplus cash flow into automated data pipeline infrastructure.",
      "Continue renegotiating enterprise cloud hosting commitments."
    ]
  }
];

export const mockChatConversations = {
  "doc-1": [
    {
      sender: "user",
      text: "What are the key interest rate predictions and how will they impact our tech spending?",
      timestamp: "14:22"
    },
    {
      sender: "ai",
      text: "According to Section 3.2 (page 14), central banks are expected to stabilize benchmark interest rates through Q4 2026, with modest easing commencing in early 2027. Despite the borrowing environment, enterprise technology spending is forecast to increase by **7.2% YoY**, with leadership prioritizing investments in automated workflow intelligence and cloud modernization to curb rising labor expenses.",
      citations: [
        { page: 14, text: "Section 3.2: Benchmark Rate Projections and Capital Expenditure Trends" },
        { page: 18, text: "Table 4: Enterprise IT Spending Forecast by Vertical (2026-2028)" }
      ],
      timestamp: "14:23"
    },
    {
      sender: "user",
      text: "What liquidity buffer does the document advise management to maintain?",
      timestamp: "14:25"
    },
    {
      sender: "ai",
      text: "In the Executive Recommendations (page 6), the report explicitly recommends maintaining a defensive liquidity buffer of **18% to 22% of annualized operational expenditures**. This provides sufficient insulation against potential supply chain friction and cross-border currency volatility.",
      citations: [
        { page: 6, text: "Executive Summary: Recommended Balance Sheet Guardrails" }
      ],
      timestamp: "14:25"
    }
  ]
};

export const initialSampleDataset = [
  { id: 1001, date: "2026-10-01", region: "North America", category: "Cloud SaaS", units: 145, revenue: 72500, cost: 21750, margin: 70.0, clientTier: "Enterprise", status: "Closed-Won" },
  { id: 1002, date: "2026-10-02", region: "EMEA", category: "Hardware", units: 82, revenue: 41000, cost: 24600, margin: 40.0, clientTier: "Mid-Market", status: "Closed-Won" },
  { id: 1003, date: "2026-10-03", region: "APAC", category: "Professional Services", units: 34, revenue: 17000, cost: 9500, margin: 44.1, clientTier: "Enterprise", status: "In-Review" },
  { id: 1004, date: "2026-10-04", region: "North America", category: "Cloud SaaS", units: 210, revenue: 105000, cost: 31500, margin: 70.0, clientTier: "Enterprise", status: "Closed-Won" },
  { id: 1005, date: "2026-10-05", region: "LATAM", category: "Hardware", units: null, revenue: 18500, cost: null, margin: 38.0, clientTier: "SMB", status: "Closed-Won" }, // Dirty row with nulls
  { id: 1006, date: "2026-10-06", region: "EMEA", category: "Cloud SaaS", units: 120, revenue: 60000, cost: 18000, margin: 70.0, clientTier: "Enterprise", status: "Closed-Won" },
  { id: 1007, date: "2026-10-06", region: "EMEA", category: "Cloud SaaS", units: 120, revenue: 60000, cost: 18000, margin: 70.0, clientTier: "Enterprise", status: "Closed-Won" }, // Duplicate row
  { id: 1008, date: "2026-10-08", region: "APAC", category: "Hardware", units: 64, revenue: 32000, cost: 19800, margin: 38.1, clientTier: "Mid-Market", status: "Pending" },
  { id: 1009, date: "2026-10-09", region: "North America", category: "Professional Services", units: 50, revenue: 25000, cost: 13000, margin: 48.0, clientTier: "Enterprise", status: "Closed-Won" },
  { id: 1010, date: "2026-10-10", region: "LATAM", category: "Cloud SaaS", units: 75, revenue: 37500, cost: 11250, margin: 70.0, clientTier: "SMB", status: "Closed-Won" },
  { id: 1011, date: "2026-10-11", region: "EMEA", category: "Hardware", units: 48, revenue: 24000, cost: 14400, margin: 40.0, clientTier: "Mid-Market", status: "In-Review" },
  { id: 1012, date: "2026-10-12", region: "North America", category: "Cloud SaaS", units: 190, revenue: 95000, cost: 28500, margin: 70.0, clientTier: "Enterprise", status: "Closed-Won" },
  { id: 1013, date: "2026-10-13", region: "APAC", category: "Professional Services", units: null, revenue: 14200, cost: 8100, margin: null, clientTier: "SMB", status: "Closed-Won" }, // Dirty row with nulls
  { id: 1014, date: "2026-10-14", region: "LATAM", category: "Professional Services", units: 28, revenue: 14000, cost: 7700, margin: 45.0, clientTier: "SMB", status: "Closed-Won" },
  { id: 1015, date: "2026-10-15", region: "North America", category: "Hardware", units: 110, revenue: 55000, cost: 33000, margin: 40.0, clientTier: "Enterprise", status: "Closed-Won" }
];

export const mockAutomationWorkflows = [
  {
    id: "wf-1",
    name: "Daily Executive MIS Summary Email",
    description: "Compiles yesterday's regional revenue, computes gross margin KPIs, and emails the PDF briefing to the Leadership team at 08:00 AM.",
    trigger: "Schedule (Cron)",
    schedule: "Daily at 08:00 AM EST",
    target: "Executive Board",
    status: "active",
    lastRun: "Today at 08:00:14 AM",
    lastStatus: "success",
    executionCount: 142
  },
  {
    id: "wf-2",
    name: "Overdue Task & Deadline Escalation Alert",
    description: "Scans all open tasks across active projects; sends high-priority notification to task assignees and managers 24 hours prior to deadline.",
    trigger: "Schedule (Hourly)",
    schedule: "Hourly Mon-Fri",
    target: "Slack & Email",
    status: "active",
    lastRun: "18 minutes ago",
    lastStatus: "success",
    executionCount: 894
  },
  {
    id: "wf-3",
    name: "Automated End-of-Month P&L Consolidation",
    description: "Pulls raw ERP transaction ledger, executes automated cleaning pipeline, recalculates EBITDA, and produces formatted Excel report.",
    trigger: "Schedule (Monthly)",
    schedule: "Last business day of month",
    target: "Finance & MIS",
    status: "active",
    lastRun: "2026-10-31 23:59:02",
    lastStatus: "success",
    executionCount: 10
  },
  {
    id: "wf-4",
    name: "PDF Research Ingestion & Vector Indexing",
    trigger: "Webhook / Event",
    schedule: "Triggered on file upload",
    description: "Extracts text with PyMuPDF, chunks sections into 512-token segments, embeds with pgvector, and notifies the Research Assistant.",
    target: "AI RAG Service",
    status: "active",
    lastRun: "Yesterday at 14:20:05",
    lastStatus: "success",
    executionCount: 68
  }
];

export const mockAutomationLogs = [
  {
    id: "log-501",
    workflowName: "Overdue Task & Deadline Escalation Alert",
    triggerType: "Schedule (Hourly)",
    executedAt: "2026-11-10 18:45:00",
    durationMs: 340,
    status: "success",
    details: "Checked 34 active tasks. Found 3 overdue tasks. Dispatched 3 notifications via Email/Webhook."
  },
  {
    id: "log-502",
    workflowName: "Daily Executive MIS Summary Email",
    triggerType: "Schedule (Cron)",
    executedAt: "2026-11-10 08:00:14",
    durationMs: 1280,
    status: "success",
    details: "Calculated daily GMV ($248,500). Generated Executive_MIS_Daily_2026-11-10.pdf. Sent to 6 recipients."
  },
  {
    id: "log-503",
    workflowName: "PDF Research Ingestion & Vector Indexing",
    triggerType: "Webhook",
    executedAt: "2026-11-09 14:20:05",
    durationMs: 2450,
    status: "success",
    details: "Parsed Global_Economic_Outlook_Q4_2026.pdf (42 pages). Generated 84 chunks and vector embeddings."
  },
  {
    id: "log-504",
    workflowName: "Overdue Task & Deadline Escalation Alert",
    triggerType: "Schedule (Hourly)",
    executedAt: "2026-11-09 17:45:00",
    durationMs: 410,
    status: "success",
    details: "Checked 34 active tasks. 0 new escalations required."
  },
  {
    id: "log-505",
    workflowName: "Automated End-of-Month P&L Consolidation",
    triggerType: "Schedule (Monthly)",
    executedAt: "2026-10-31 23:59:02",
    durationMs: 3890,
    status: "success",
    details: "Processed 14,280 ledger rows. Null rate 0.02%. Generated October_Consolidated_PL.xlsx."
  }
];

export const mockGeneratedReports = [
  {
    id: "rep-01",
    name: "Q4_Regional_Sales_Performance_MIS.xlsx",
    category: "Financial Analytics",
    format: "Excel",
    size: "1.4 MB",
    generatedAt: "2026-11-09 16:30",
    generatedBy: "Priya Sharma",
    kpisIncluded: ["Revenue ($577.2k)", "Gross Margin (58.4%)", "Closed-Won Rate (86%)"],
    downloadCount: 14
  },
  {
    id: "rep-02",
    name: "Executive_Board_Operations_Briefing_Nov2026.pdf",
    category: "Executive Briefing",
    format: "PDF",
    size: "3.2 MB",
    generatedAt: "2026-11-08 10:15",
    generatedBy: "Sarah Jenkins",
    kpisIncluded: ["Project Health (83%)", "Task Velocity", "Budget Allocation"],
    downloadCount: 22
  },
  {
    id: "rep-03",
    name: "Vendor_Cost_Variance_Cleaned_Dataset.xlsx",
    category: "Operations MIS",
    format: "Excel",
    size: "890 KB",
    generatedAt: "2026-11-06 14:45",
    generatedBy: "David Ross",
    kpisIncluded: ["Cleaned Rows: 1,420", "Duplicates Removed: 18", "Nulls Imputed: 34"],
    downloadCount: 9
  },
  {
    id: "rep-04",
    name: "Macroeconomic_AI_Research_Synthesis.pdf",
    category: "Strategic Intelligence",
    format: "PDF",
    size: "2.1 MB",
    generatedAt: "2026-11-04 11:20",
    generatedBy: "Michael Chang",
    kpisIncluded: ["42 Cited Sources", "Interest Rate Forecast", "Capex Benchmarks"],
    downloadCount: 31
  }
];

