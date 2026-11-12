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
import {
  analyzeDatasetRows,
  cleanDatasetRows,
  parseCsvText
} from '../utils/dataCleaning';

const AppContext = createContext();

const STORAGE_KEYS = {
  reports: 'execumate_reports_v1',
  deletedReportIds: 'execumate_deleted_report_ids_v1',
  documents: 'execumate_documents_v1',
  deletedDocIds: 'execumate_deleted_doc_ids_v1'
};

function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

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
          const deletedIds = new Set(readStorage(STORAGE_KEYS.deletedReportIds, []));
          const formattedReports = liveReports
            .filter(r => !deletedIds.has(r.id))
            .map(r => ({
              id: r.id,
              name: r.report_name,
              category: r.category,
              format: r.report_name?.toLowerCase().endsWith('.pdf') ? "PDF" : "Excel",
              size: r.file_size || "1.2 MB",
              generatedAt: r.generated_at ? r.generated_at.split('T')[0] : "2026-11-10",
              generatedBy: "ExecuMate Engine",
              kpisIncluded: ["Cleaned Ledger Data", "Regional Margin", "Executive Summary"],
              downloadCount: 1
            }));
          setReports(prev => {
            const merged = [
              ...formattedReports,
              ...prev.filter(pr => !deletedIds.has(pr.id) && !formattedReports.some(fr => fr.id === pr.id))
            ];
            writeStorage(STORAGE_KEYS.reports, merged);
            return merged;
          });
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
  const initialCleanResult = useMemo(() => cleanDatasetRows(initialSampleDataset, 'auto'), []);
  const [rawDataset, setRawDataset] = useState(initialSampleDataset);
  const [dataset, setDataset] = useState(initialCleanResult.cleanedRows);
  const [datasetName, setDatasetName] = useState('regional_sales_q4_uncleaned.csv');
  const [imputationStrategy, setImputationStrategy] = useState('auto');
  const [isDataCleaned, setIsDataCleaned] = useState(true);

  const datasetAnalysis = useMemo(() => analyzeDatasetRows(dataset), [dataset]);

  const [cleaningStats, setCleaningStats] = useState({
    duplicatesRemoved: initialCleanResult.duplicatesRemoved,
    missingValuesImputed: initialCleanResult.missingValuesImputed,
    initialRows: initialCleanResult.initialRows,
    currentRows: initialCleanResult.currentRows,
    cleanQualityScore: initialCleanResult.cleanQualityScore,
    strategy: 'auto',
    imputationDetails: initialCleanResult.imputationDetails
  });

  const cleanData = (strategyOverride) => {
    const activeStrategy = typeof strategyOverride === 'string' ? strategyOverride : imputationStrategy;
    if (typeof strategyOverride === 'string') {
      setImputationStrategy(strategyOverride);
    }

    const result = cleanDatasetRows(rawDataset, activeStrategy);
    setDataset(result.cleanedRows);
    setIsDataCleaned(true);
    setCleaningStats({
      duplicatesRemoved: result.duplicatesRemoved,
      missingValuesImputed: result.missingValuesImputed,
      initialRows: result.initialRows,
      currentRows: result.currentRows,
      cleanQualityScore: result.cleanQualityScore,
      strategy: activeStrategy,
      imputationDetails: result.imputationDetails
    });

    const summaryText = result.imputationDetails
      .filter((d) => d.isNumeric)
      .map((d) => `${d.column} -> ${d.value} (${d.method})`)
      .join(', ');

    showToast(
      summaryText
        ? `Data cleaned! Replaced ${result.missingValuesImputed} nulls (${summaryText}).`
        : 'Data cleaned successfully! Duplicates removed and missing values imputed.'
    );
  };

  const resetData = () => {
    setDataset(rawDataset);
    setIsDataCleaned(false);
    setCleaningStats((prev) => ({
      ...prev,
      duplicatesRemoved: 0,
      missingValuesImputed: 0,
      imputationDetails: []
    }));
    showToast('Dataset reset to original raw file.', 'info');
  };

  const [isDatasetUploading, setIsDatasetUploading] = useState(false);

  const applyDatasetRows = (rows, fileName) => {
    const cleaned = cleanDatasetRows(rows, imputationStrategy);
    setRawDataset(rows);
    setDataset(cleaned.cleanedRows);
    setDatasetName(fileName);
    setIsDataCleaned(true);
    setCleaningStats({
      duplicatesRemoved: cleaned.duplicatesRemoved,
      missingValuesImputed: cleaned.missingValuesImputed,
      initialRows: cleaned.initialRows,
      currentRows: cleaned.currentRows,
      cleanQualityScore: cleaned.cleanQualityScore,
      strategy: imputationStrategy,
      imputationDetails: cleaned.imputationDetails
    });
    const summaryText = cleaned.imputationDetails
      .filter((d) => d.isNumeric)
      .map((d) => `${d.column} -> ${d.value} (${d.method})`)
      .join(', ');
    showToast(
      summaryText
        ? `Loaded "${fileName}" (${rows.length} rows) and replaced ${cleaned.missingValuesImputed} nulls (${summaryText}).`
        : `Loaded dataset "${fileName}" (${cleaned.currentRows} rows).`,
      'success'
    );
  };

  const loadUploadedDataset = async (file) => {
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    setIsDatasetUploading(true);
    try {
      if (lowerName.endsWith('.csv')) {
        const text = await file.text();
        const { rows } = parseCsvText(text);
        if (rows.length > 0) {
          applyDatasetRows(rows, file.name);
          api.uploadDataset(file).catch(() => {});
          return;
        }
        showToast(`"${file.name}" appears empty or has no data rows.`, 'warning');
        return;
      }

      if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        showToast(`Uploading & parsing Excel file "${file.name}"...`, 'info');
        const uploaded = await api.uploadDataset(file);
        if (Array.isArray(uploaded?.rows) && uploaded.rows.length > 0) {
          applyDatasetRows(uploaded.rows, uploaded.filename || file.name);
          return;
        }
        showToast(`"${file.name}" appears empty or could not be parsed.`, 'warning');
        return;
      }

      showToast('Unsupported file format. Please upload a .csv, .xlsx, or .xls file.', 'warning');
    } catch (err) {
      showToast(`Could not parse "${file.name}": ${err.message}. Try exporting as .csv if the backend is waking up.`, 'warning');
    } finally {
      setIsDatasetUploading(false);
    }
  };

  const restoreSampleDataset = () => {
    applyDatasetRows(initialSampleDataset, 'regional_sales_q4_uncleaned.csv');
  };

  // AI Research Assistant Module
  const [documents, setDocuments] = useState(() => {
    const saved = readStorage(STORAGE_KEYS.documents, null);
    const deletedIds = new Set(readStorage(STORAGE_KEYS.deletedDocIds, []));
    const base = saved !== null ? saved : mockDocuments;
    return base.filter(d => !deletedIds.has(d.id));
  });
  const [selectedDocId, setSelectedDocId] = useState(() => documents[0]?.id || null);
  const [conversations, setConversations] = useState(mockChatConversations);

  const selectedDocument = useMemo(() => {
    return documents.find(d => d.id === selectedDocId) || documents[0] || null;
  }, [documents, selectedDocId]);

  const activeMessages = useMemo(() => {
    return conversations[selectedDocId] || [];
  }, [conversations, selectedDocId]);

  const askDocumentQuestion = (question) => {
    if (!question.trim() || !selectedDocument) return;

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
    setDocuments(prev => {
      const next = [newDoc, ...prev];
      writeStorage(STORAGE_KEYS.documents, next);
      return next;
    });
    setSelectedDocId(newDoc.id);
    showToast(`"${newDoc.title}" uploaded and indexed successfully!`);
  };

  const deleteDocument = async (docId) => {
    const docToDelete = documents.find(d => d.id === docId);
    const deletedIds = new Set(readStorage(STORAGE_KEYS.deletedDocIds, []));
    deletedIds.add(docId);
    writeStorage(STORAGE_KEYS.deletedDocIds, Array.from(deletedIds));

    setDocuments(prev => {
      const remaining = prev.filter(d => d.id !== docId);
      writeStorage(STORAGE_KEYS.documents, remaining);
      if (selectedDocId === docId) {
        setSelectedDocId(remaining[0]?.id || null);
      }
      return remaining;
    });
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
  const [reports, setReports] = useState(() => {
    const saved = readStorage(STORAGE_KEYS.reports, null);
    const deletedIds = new Set(readStorage(STORAGE_KEYS.deletedReportIds, []));
    const base = saved !== null ? saved : mockGeneratedReports;
    return base.filter(r => !deletedIds.has(r.id));
  });

  const generateReportFromData = async (name, category = "Executive MIS") => {
    const reportFilename = name || `Executive_MIS_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const tempId = `rep-${Date.now()}`;
    const newRep = {
      id: tempId,
      name: reportFilename,
      category: category,
      format: reportFilename.toLowerCase().endsWith('.pdf') ? "PDF" : "Excel",
      size: "1.2 MB",
      generatedAt: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      generatedBy: currentUser.name,
      kpisIncluded: [`Cleaned records: ${dataset.length}`, "Regional Summary", "Gross Margin Analysis"],
      downloadCount: 0
    };
    setReports(prev => {
      const next = [newRep, ...prev];
      writeStorage(STORAGE_KEYS.reports, next);
      return next;
    });
    showToast(`Report "${newRep.name}" generated and ready for download!`);

    try {
      const created = await api.generateReport(reportFilename, category);
      if (created?.id) {
        setReports(prev => {
          const updated = prev.map(r => (r.id === tempId ? { ...r, id: created.id, size: created.file_size || r.size } : r));
          writeStorage(STORAGE_KEYS.reports, updated);
          return updated;
        });
      }
    } catch (e) {
      // Local state already updated
    }
  };

  const deleteReport = async (reportId) => {
    const reportToDelete = reports.find(r => r.id === reportId);
    const deletedIds = new Set(readStorage(STORAGE_KEYS.deletedReportIds, []));
    deletedIds.add(reportId);
    writeStorage(STORAGE_KEYS.deletedReportIds, Array.from(deletedIds));

    setReports(prev => {
      const next = prev.filter(r => r.id !== reportId);
      writeStorage(STORAGE_KEYS.reports, next);
      return next;
    });
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
        datasetName,
        datasetAnalysis,
        imputationStrategy,
        setImputationStrategy,
        isDataCleaned,
        cleaningStats,
        cleanData,
        resetData,
        loadUploadedDataset,
        restoreSampleDataset,
        isDatasetUploading,
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
