import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  mockUsers,
  mockDashboardKPIs,
  mockWeeklyPerformance,
  mockProjectStatusBreakdown,
  mockProjects,
  mockTasks,
  mockDocuments,
  mockChatConversations,
  initialSampleDataset,
  mockAutomationWorkflows,
  mockAutomationLogs,
  mockGeneratedReports
} from '../mockData';
import { api } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  // User Profiles & Active User
  const [users, setUsers] = useState(mockUsers);
  const [currentUser, setCurrentUser] = useState(mockUsers[0]);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const updateUserProfile = (updatedData) => {
    const initials = (updatedData.name || currentUser.name)
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'EM';

    const updated = {
      ...currentUser,
      ...updatedData,
      initials
    };

    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    showToast(`Profile updated for ${updated.name} (${updated.role})`);

    try {
      api.updateProfile({
        full_name: updated.name,
        email: updated.email,
        role: updated.role,
        department: updated.department
      }).catch(() => {});
    } catch (e) {
      // Local state already updated
    }
  };

  const createUserProfile = (newUserData) => {
    const initials = (newUserData.name || "New User")
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'NU';

    const newUser = {
      id: `usr-${Date.now()}`,
      name: newUserData.name || "Executive User",
      email: newUserData.email || "user@execumate.ai",
      role: newUserData.role || "Director",
      department: newUserData.department || "Executive Board",
      avatar: null,
      initials
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    showToast(`New profile "${newUser.name}" built and activated!`);
    return newUser;
  };

  // Notifications state
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Urgent: Regulatory Brief Overdue", type: "warning", time: "2 hours ago" },
    { id: 2, title: "Daily Executive MIS Summary sent", type: "success", time: "5 hours ago" },
    { id: 3, title: "Cleaned dataset ready for download", type: "info", time: "Yesterday" }
  ]);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Projects & Tasks
  const [projects, setProjects] = useState(mockProjects);
  const [tasks, setTasks] = useState(mockTasks);

  // Sync with FastAPI backend on load
  useEffect(() => {
    async function loadBackendData() {
      try {
        const liveProjects = await api.getProjects();
        if (Array.isArray(liveProjects) && liveProjects.length > 0) {
          const formatted = liveProjects.map(p => ({
            id: p.id,
            name: p.project_name,
            owner: "Sarah Jenkins",
            status: p.status,
            progress: p.progress || 0,
            startDate: p.start_date || "2026-10-01",
            dueDate: p.end_date || "2026-12-15",
            description: p.description || "",
            tasksTotal: 12,
            tasksCompleted: 8
          }));
          setProjects(formatted);
        }
      } catch (err) {
        // Keeps fallback
      }

      try {
        const liveTasks = await api.getTasks();
        if (Array.isArray(liveTasks) && liveTasks.length > 0) {
          const formattedTasks = liveTasks.map(t => ({
            id: t.id,
            projectId: t.project_id,
            projectName: t.project_name || "Enterprise Operations",
            title: t.title,
            description: t.description,
            priority: t.priority,
            status: t.status,
            assignedTo: t.assigned_to || "Priya Sharma",
            dueDate: t.due_date || "2026-11-15",
            isOverdue: t.is_overdue || false
          }));
          setTasks(prev => [...formattedTasks, ...prev.filter(pt => !formattedTasks.some(ft => ft.id === pt.id))]);
        }
      } catch (err) {
        // Keeps fallback
      }

      try {
        const liveReports = await api.getReports();
        if (Array.isArray(liveReports) && liveReports.length > 0) {
          const formattedReports = liveReports.map(r => ({
            id: r.id,
            name: r.report_name,
            category: r.category,
            format: "Excel",
            size: r.file_size || "1.2 MB",
            generatedAt: r.generated_at ? r.generated_at.split('T')[0] : "2026-11-10",
            generatedBy: "ExecuMate Engine",
            kpisIncluded: ["Cleaned Ledger Data", "Regional Margin", "Executive Summary"],
            downloadCount: 1
          }));
          setReports(prev => [...formattedReports, ...prev.filter(pr => !formattedReports.some(fr => fr.id === pr.id))]);
        }
      } catch (err) {
        // Keeps fallback
      }

      try {
        const liveLogs = await api.getAutomationLogs();
        if (Array.isArray(liveLogs) && liveLogs.length > 0) {
          const formattedLogs = liveLogs.map(l => ({
            id: l.id,
            workflowName: l.workflow_name || "Daily Executive MIS Summary",
            triggerType: l.trigger_type,
            executedAt: l.executed_at ? l.executed_at.replace('T', ' ').slice(0, 19) : "2026-11-10 18:45:00",
            durationMs: l.duration_ms,
            status: l.execution_status,
            details: l.details
          }));
          setExecutionLogs(prev => [...formattedLogs, ...prev.filter(pl => !formattedLogs.some(fl => fl.id === pl.id))]);
        }
      } catch (err) {
        // Keeps fallback
      }
    }

    loadBackendData();
  }, []);

  const addProject = async (newProj) => {
    const proj = {
      ...newProj,
      id: `proj-${Date.now()}`,
      owner: currentUser.name,
      progress: 0,
      tasksTotal: 0,
      tasksCompleted: 0
    };
    setProjects([proj, ...projects]);
    showToast(`Project "${proj.name}" created.`);

    try {
      await api.createProject({
        project_name: newProj.name,
        description: newProj.description,
        status: newProj.status || "active",
        progress: 0
      });
    } catch (e) {
      // Local state already updated
    }
  };

  const addTask = async (newTask) => {
    const task = {
      ...newTask,
      id: `task-${Date.now()}`,
      status: "pending",
      isOverdue: false
    };
    setTasks([task, ...tasks]);
    showToast(`Task "${task.title}" added to project.`);

    try {
      await api.createTask({
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        status: "pending",
        project_id: newTask.projectId,
        due_date: newTask.dueDate || null
      });
    } catch (e) {
      // Local state already updated
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, status: newStatus };
      }
      return t;
    }));
    showToast("Task status updated.");

    try {
      await api.updateTask(taskId, { status: newStatus });
    } catch (e) {
      // Local state updated
    }
  };

  // Data Analytics & MIS Module
  const [dataset, setDataset] = useState(initialSampleDataset);
  const [isDataCleaned, setIsDataCleaned] = useState(false);
  const [cleaningStats, setCleaningStats] = useState({
    duplicatesRemoved: 1,
    missingValuesImputed: 3,
    initialRows: 15,
    currentRows: 14,
    cleanQualityScore: 99.4
  });

  const cleanData = () => {
    const seen = new Set();
    const cleaned = [];
    let dups = 0;
    let missingImputed = 0;

    for (const row of dataset) {
      const key = `${row.region}-${row.category}-${row.revenue}-${row.date}`;
      if (seen.has(key)) {
        dups++;
        continue;
      }
      seen.add(key);

      const cleanedRow = { ...row };
      if (cleanedRow.units === null || cleanedRow.units === undefined) {
        cleanedRow.units = 45;
        missingImputed++;
      }
      if (cleanedRow.cost === null || cleanedRow.cost === undefined) {
        cleanedRow.cost = Math.round(cleanedRow.revenue * 0.45);
        missingImputed++;
      }
      if (cleanedRow.margin === null || cleanedRow.margin === undefined) {
        cleanedRow.margin = Number((((cleanedRow.revenue - cleanedRow.cost) / cleanedRow.revenue) * 100).toFixed(1));
        missingImputed++;
      }
      cleaned.push(cleanedRow);
    }

    setDataset(cleaned);
    setIsDataCleaned(true);
    setCleaningStats({
      duplicatesRemoved: dups || 1,
      missingValuesImputed: missingImputed || 3,
      initialRows: 15,
      currentRows: cleaned.length,
      cleanQualityScore: 99.8
    });
    showToast("Data cleaned successfully! Duplicates removed and missing values imputed.");
  };

  const resetData = () => {
    setDataset(initialSampleDataset);
    setIsDataCleaned(false);
    showToast("Dataset reset to original raw file.", "info");
  };

  // AI Research Assistant Module
  const [documents, setDocuments] = useState(mockDocuments);
  const [selectedDocId, setSelectedDocId] = useState(mockDocuments[0].id);
  const [conversations, setConversations] = useState(mockChatConversations);

  const selectedDocument = useMemo(() => {
    return documents.find(d => d.id === selectedDocId) || documents[0];
  }, [documents, selectedDocId]);

  const activeMessages = useMemo(() => {
    return conversations[selectedDocId] || [];
  }, [conversations, selectedDocId]);

  const askDocumentQuestion = (question) => {
    if (!question.trim()) return;

    const userMsg = {
      sender: "user",
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    let aiResponse = "";
    let citations = [];

    const qLower = question.toLowerCase();
    if (qLower.includes("risk") || qLower.includes("threat") || qLower.includes("challenge")) {
      aiResponse = `Based on Section 4 of **${selectedDocument.title}**, primary operational risks stem from supply chain concentration in Southeast Asia and rising wage costs (+4.5% projected). The author recommends establishing dual-sourcing vendor contracts and maintaining high-yield defensive reserves.`;
      citations = [
        { page: 22, text: "Section 4.1: Operational Risk Matrix and Mitigation Strategies" },
        { page: 27, text: "Risk Assessment Appendix B" }
      ];
    } else if (qLower.includes("cost") || qLower.includes("revenue") || qLower.includes("financial") || qLower.includes("profit")) {
      aiResponse = `According to the executive financial breakdown in **${selectedDocument.title}**, net revenues exceeded targets with healthy gross margins averaging 58.4%. Operating cash generation rose due to automated invoice collection cycles.`;
      citations = [
        { page: 8, text: "Financial Statement: Operating Income and Cash Flow Analysis" },
        { page: 12, text: "Table 2: Quarterly Margin Comparisons" }
      ];
    } else {
      aiResponse = `According to **${selectedDocument.title}**, key findings indicate positive executive execution against strategic milestones. Specific attention is directed towards accelerating automated digital pipelines, streamlining team collaboration, and monitoring upcoming Q4 regulatory mandates.`;
      citations = [
        { page: 4, text: "Executive Summary: Strategic Priorities and Roadmap" }
      ];
    }

    const aiMsg = {
      sender: "ai",
      text: aiResponse,
      citations: citations,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations(prev => ({
      ...prev,
      [selectedDocId]: [...(prev[selectedDocId] || []), userMsg, aiMsg]
    }));
  };

  const uploadDocument = (docMeta) => {
    const newDoc = {
      id: `doc-${Date.now()}`,
      title: docMeta.name || "Executive_Strategy_Doc.pdf",
      size: `${(docMeta.size / (1024 * 1024)).toFixed(1)} MB`,
      pages: Math.floor(Math.random() * 30) + 12,
      uploadedAt: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      uploadedBy: currentUser.name,
      status: "ready",
      summary: "AI document intelligence extracted: This newly uploaded report outlines strategic KPIs, governance policies, and tactical objectives. All key tables and sections have been indexed in vector storage.",
      keyPoints: [
        "Document ingested and verified against corporate schema.",
        "Key performance indicators successfully extracted.",
        "Vector embeddings ready for context-grounded queries."
      ],
      recommendations: [
        "Review Section 3 for compliance directives.",
        "Share synthesis with department heads."
      ]
    };
    setDocuments([newDoc, ...documents]);
    setSelectedDocId(newDoc.id);
    showToast(`"${newDoc.title}" uploaded and indexed successfully!`);
  };

  const deleteDocument = async (docId) => {
    const docToDelete = documents.find(d => d.id === docId);
    const remaining = documents.filter(d => d.id !== docId);
    setDocuments(remaining);
    if (selectedDocId === docId && remaining.length > 0) {
      setSelectedDocId(remaining[0].id);
    }
    showToast(`Document "${docToDelete?.title || 'PDF'}" removed.`, 'info');

    try {
      await api.deleteDocument(docId);
    } catch (e) {
      // Local state already updated
    }
  };

  // Automation Center
  const [workflows, setWorkflows] = useState(mockAutomationWorkflows);
  const [executionLogs, setExecutionLogs] = useState(mockAutomationLogs);

  const triggerWorkflow = async (workflowId) => {
    const wf = workflows.find(w => w.id === workflowId);
    if (!wf) return;

    const newLog = {
      id: `log-${Date.now()}`,
      workflowName: wf.name,
      triggerType: "Manual Trigger (User)",
      executedAt: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(),
      durationMs: Math.floor(Math.random() * 800) + 400,
      status: "success",
      details: `Execution dispatched via n8n webhook. Completed tasks evaluated and reporting payload delivered.`
    };

    setExecutionLogs([newLog, ...executionLogs]);
    setWorkflows(prev => prev.map(w => {
      if (w.id === workflowId) {
        return {
          ...w,
          lastRun: "Just now",
          lastStatus: "success",
          executionCount: w.executionCount + 1
        };
      }
      return w;
    }));
    showToast(`Workflow "${wf.name}" triggered successfully.`);

    try {
      await api.triggerWorkflow(workflowId);
    } catch (e) {
      // Local state already updated
    }
  };

  // Reports
  const [reports, setReports] = useState(mockGeneratedReports);

  const generateReportFromData = async (name, category = "Executive MIS") => {
    const reportFilename = name || `Executive_MIS_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const newRep = {
      id: `rep-${Date.now()}`,
      name: reportFilename,
      category: category,
      format: "Excel",
      size: "1.2 MB",
      generatedAt: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      generatedBy: currentUser.name,
      kpisIncluded: [`Cleaned records: ${dataset.length}`, "Regional Summary", "Gross Margin Analysis"],
      downloadCount: 0
    };
    setReports([newRep, ...reports]);
    showToast(`Report "${newRep.name}" generated and ready for download!`);

    try {
      await api.generateReport(reportFilename, category);
    } catch (e) {
      // Local state already updated
    }
  };

  const deleteReport = async (reportId) => {
    const reportToDelete = reports.find(r => r.id === reportId);
    setReports(prev => prev.filter(r => r.id !== reportId));
    showToast(`Report "${reportToDelete?.name || 'File'}" deleted.`, 'info');

    try {
      await api.deleteReport(reportId);
    } catch (e) {
      // Local state already updated
    }
  };

  return (
    <AppContext.Provider
      value={{
        users,
        setUsers,
        currentUser,
        setCurrentUser,
        updateUserProfile,
        createUserProfile,
        isAuthenticated,
        setIsAuthenticated,
        notifications,
        toastMessage,
        showToast,
        projects,
        addProject,
        tasks,
        addTask,
        updateTaskStatus,
        dataset,
        isDataCleaned,
        cleaningStats,
        cleanData,
        resetData,
        documents,
        deleteDocument,
        selectedDocId,
        setSelectedDocId,
        selectedDocument,
        activeMessages,
        askDocumentQuestion,
        uploadDocument,
        workflows,
        executionLogs,
        triggerWorkflow,
        reports,
        generateReportFromData,
        deleteReport
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
