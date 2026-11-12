import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  mockUsers,
  mockDashboardKPIs,
  mockWeeklyPerformance,
  mockProjectStatusBreakdown,
  mockProjects,
  mockTasks,
  mockAutomationWorkflows,
  mockAutomationLogs
} from '../mockData';
import { api } from '../services/api';
import {
  analyzeDatasetRows,
  cleanDatasetRows,
  parseCsvText
} from '../utils/dataCleaning';

const AppContext = createContext();

const STORAGE_KEYS = {
  reports: 'execumate_reports_v2',
  deletedReportIds: 'execumate_deleted_report_ids_v2',
  documents: 'execumate_documents_v2',
  deletedDocIds: 'execumate_deleted_doc_ids_v2',
  dataset: 'execumate_dataset_v2',
  rawDataset: 'execumate_raw_dataset_v2',
  datasetName: 'execumate_dataset_name_v2',
  datasetId: 'execumate_dataset_id_v2',
  cleaningStats: 'execumate_cleaning_stats_v2',
  isDataCleaned: 'execumate_is_data_cleaned_v2'
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
              size: r.file_size || "12.0 KB",
              generatedAt: r.generated_at ? r.generated_at.split('T')[0] : new Date().toISOString().slice(0, 10),
              generatedBy: "ExecuMate Engine",
              kpisIncluded: ["Generated from Uploaded Dataset"],
              downloadCount: 1
            }));
          setReports(prev => {
            const merged = [
              ...formattedReports.map(fr => {
                const existing = prev.find(pr => pr.id === fr.id);
                return existing ? { ...fr, kpisIncluded: existing.kpisIncluded, sourceDataset: existing.sourceDataset, rowsSnapshot: existing.rowsSnapshot } : fr;
              }),
              ...prev.filter(pr => !deletedIds.has(pr.id) && !formattedReports.some(fr => fr.id === pr.id))
            ];
            writeStorage(STORAGE_KEYS.reports, merged);
            return merged;
          });
        }
      } catch (err) {
        // Keeps localStorage state
      }

      try {
        const liveDocs = await api.getDocuments();
        if (Array.isArray(liveDocs) && liveDocs.length > 0) {
          const deletedDocIds = new Set(readStorage(STORAGE_KEYS.deletedDocIds, []));
          const formattedDocs = liveDocs
            .filter(d => !deletedDocIds.has(d.id))
            .map(d => ({
              id: d.id,
              title: d.filename,
              size: d.file_size || "1.0 MB",
              pages: d.page_count || 1,
              uploadedAt: d.uploaded_at ? d.uploaded_at.split('T')[0] : new Date().toISOString().slice(0, 10),
              uploadedBy: currentUser.name,
              status: d.status || "ready",
              summary: d.summary || "PDF uploaded and indexed for document Q&A.",
              keyPoints: ["Document extracted via PyMuPDF.", "Ready for grounded Q&A."],
              recommendations: ["Ask questions about this PDF in the chat panel."]
            }));
          setDocuments(prev => {
            const merged = [
              ...formattedDocs.map(fd => {
                const existing = prev.find(pd => pd.id === fd.id);
                return existing ? { ...fd, keyPoints: existing.keyPoints, recommendations: existing.recommendations } : fd;
              }),
              ...prev.filter(pd => !deletedDocIds.has(pd.id) && !formattedDocs.some(fd => fd.id === pd.id))
            ];
            writeStorage(STORAGE_KEYS.documents, merged);
            return merged;
          });
        }
      } catch (err) {
        // Keeps localStorage state
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

  // Data Analytics & MIS Module (starts empty; persisted when user uploads a file)
  const [rawDataset, setRawDataset] = useState(() => readStorage(STORAGE_KEYS.rawDataset, []));
  const [dataset, setDataset] = useState(() => readStorage(STORAGE_KEYS.dataset, []));
  const [datasetName, setDatasetName] = useState(() => readStorage(STORAGE_KEYS.datasetName, ''));
  const [activeDatasetId, setActiveDatasetId] = useState(() => readStorage(STORAGE_KEYS.datasetId, null));
  const [imputationStrategy, setImputationStrategy] = useState('auto');
  const [isDataCleaned, setIsDataCleaned] = useState(() => readStorage(STORAGE_KEYS.isDataCleaned, false));

  const datasetAnalysis = useMemo(() => analyzeDatasetRows(dataset), [dataset]);

  const [cleaningStats, setCleaningStats] = useState(() =>
    readStorage(STORAGE_KEYS.cleaningStats, {
      duplicatesRemoved: 0,
      missingValuesImputed: 0,
      initialRows: 0,
      currentRows: 0,
      cleanQualityScore: 100,
      strategy: 'auto',
      imputationDetails: []
    })
  );

  const cleanData = (strategyOverride) => {
    if (!rawDataset || rawDataset.length === 0) {
      showToast('Please upload a CSV or Excel dataset first.', 'warning');
      return;
    }

    const activeStrategy = typeof strategyOverride === 'string' ? strategyOverride : imputationStrategy;
    if (typeof strategyOverride === 'string') {
      setImputationStrategy(strategyOverride);
    }

    const result = cleanDatasetRows(rawDataset, activeStrategy);
    const nextStats = {
      duplicatesRemoved: result.duplicatesRemoved,
      missingValuesImputed: result.missingValuesImputed,
      initialRows: result.initialRows,
      currentRows: result.currentRows,
      cleanQualityScore: result.cleanQualityScore,
      strategy: activeStrategy,
      imputationDetails: result.imputationDetails
    };

    setDataset(result.cleanedRows);
    setIsDataCleaned(true);
    setCleaningStats(nextStats);
    writeStorage(STORAGE_KEYS.dataset, result.cleanedRows);
    writeStorage(STORAGE_KEYS.isDataCleaned, true);
    writeStorage(STORAGE_KEYS.cleaningStats, nextStats);

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
    const emptyStats = {
      duplicatesRemoved: 0,
      missingValuesImputed: 0,
      initialRows: rawDataset.length,
      currentRows: rawDataset.length,
      cleanQualityScore: 100,
      strategy: imputationStrategy,
      imputationDetails: []
    };
    setDataset(rawDataset);
    setIsDataCleaned(false);
    setCleaningStats(emptyStats);
    writeStorage(STORAGE_KEYS.dataset, rawDataset);
    writeStorage(STORAGE_KEYS.isDataCleaned, false);
    writeStorage(STORAGE_KEYS.cleaningStats, emptyStats);
    showToast('Dataset reset to original uploaded raw file.', 'info');
  };

  const clearDataset = () => {
    const emptyStats = {
      duplicatesRemoved: 0,
      missingValuesImputed: 0,
      initialRows: 0,
      currentRows: 0,
      cleanQualityScore: 100,
      strategy: imputationStrategy,
      imputationDetails: []
    };
    setRawDataset([]);
    setDataset([]);
    setDatasetName('');
    setActiveDatasetId(null);
    setIsDataCleaned(false);
    setCleaningStats(emptyStats);
    writeStorage(STORAGE_KEYS.rawDataset, []);
    writeStorage(STORAGE_KEYS.dataset, []);
    writeStorage(STORAGE_KEYS.datasetName, '');
    writeStorage(STORAGE_KEYS.datasetId, null);
    writeStorage(STORAGE_KEYS.isDataCleaned, false);
    writeStorage(STORAGE_KEYS.cleaningStats, emptyStats);
    showToast('Uploaded dataset cleared.', 'info');
  };

  const [isDatasetUploading, setIsDatasetUploading] = useState(false);

  const applyDatasetRows = (rows, fileName, uploadedDatasetId = null) => {
    const cleaned = cleanDatasetRows(rows, imputationStrategy);
    const nextStats = {
      duplicatesRemoved: cleaned.duplicatesRemoved,
      missingValuesImputed: cleaned.missingValuesImputed,
      initialRows: cleaned.initialRows,
      currentRows: cleaned.currentRows,
      cleanQualityScore: cleaned.cleanQualityScore,
      strategy: imputationStrategy,
      imputationDetails: cleaned.imputationDetails
    };

    setRawDataset(rows);
    setDataset(cleaned.cleanedRows);
    setDatasetName(fileName);
    setActiveDatasetId(uploadedDatasetId);
    setIsDataCleaned(true);
    setCleaningStats(nextStats);

    writeStorage(STORAGE_KEYS.rawDataset, rows);
    writeStorage(STORAGE_KEYS.dataset, cleaned.cleanedRows);
    writeStorage(STORAGE_KEYS.datasetName, fileName);
    writeStorage(STORAGE_KEYS.datasetId, uploadedDatasetId);
    writeStorage(STORAGE_KEYS.isDataCleaned, true);
    writeStorage(STORAGE_KEYS.cleaningStats, nextStats);

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
          applyDatasetRows(rows, file.name, null);
          api.uploadDataset(file)
            .then((uploaded) => {
              if (uploaded?.id) {
                setActiveDatasetId(uploaded.id);
                writeStorage(STORAGE_KEYS.datasetId, uploaded.id);
              }
            })
            .catch(() => {});
          return;
        }
        showToast(`"${file.name}" appears empty or has no data rows.`, 'warning');
        return;
      }

      if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        showToast(`Uploading & parsing Excel file "${file.name}"...`, 'info');
        const uploaded = await api.uploadDataset(file);
        if (Array.isArray(uploaded?.rows) && uploaded.rows.length > 0) {
          applyDatasetRows(uploaded.rows, uploaded.filename || file.name, uploaded.id || null);
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

  // AI Research Assistant Module (starts empty; persisted when user uploads PDFs)
  const [documents, setDocuments] = useState(() => {
    const saved = readStorage(STORAGE_KEYS.documents, []);
    const deletedIds = new Set(readStorage(STORAGE_KEYS.deletedDocIds, []));
    return Array.isArray(saved) ? saved.filter(d => !deletedIds.has(d.id)) : [];
  });
  const [selectedDocId, setSelectedDocId] = useState(() => documents[0]?.id || null);
  const [conversations, setConversations] = useState({});

  const selectedDocument = useMemo(() => {
    return documents.find(d => d.id === selectedDocId) || documents[0] || null;
  }, [documents, selectedDocId]);

  const activeMessages = useMemo(() => {
    return conversations[selectedDocId] || [];
  }, [conversations, selectedDocId]);

  const askDocumentQuestion = async (question) => {
    if (!question.trim() || !selectedDocument) return;

    const targetDocId = selectedDocument.id;
    const targetDocTitle = selectedDocument.title;
    const targetSummary = selectedDocument.summary;

    const userMsg = {
      sender: "user",
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations(prev => ({
      ...prev,
      [targetDocId]: [...(prev[targetDocId] || []), userMsg]
    }));

    let aiResponse = "";
    let citations = [];

    try {
      const apiRes = await api.askDocumentQuestion(targetDocId, question);
      if (apiRes?.answer) {
        aiResponse = apiRes.answer;
        citations = apiRes.citations || [];
      }
    } catch {
      // Fallback below using uploaded document's extracted summary
    }

    if (!aiResponse) {
      aiResponse = `Based on **${targetDocTitle}**: ${targetSummary || 'Your uploaded PDF has been indexed. Please ensure the backend service is online for full page-by-page RAG extraction.'}`;
      citations = [{ page: 1, text: targetDocTitle }];
    }

    const aiMsg = {
      sender: "ai",
      text: aiResponse,
      citations: citations,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations(prev => ({
      ...prev,
      [targetDocId]: [...(prev[targetDocId] || []), aiMsg]
    }));
  };

  const uploadDocument = async (file) => {
    if (!file) return;
    const fileSizeLabel = file.size >= 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(file.size / 1024))} KB`;

    let uploadedDoc = null;
    try {
      const res = await api.uploadDocument(file);
      if (res?.id) {
        uploadedDoc = {
          id: res.id,
          title: res.filename || file.name,
          size: res.file_size || fileSizeLabel,
          pages: res.page_count || 1,
          uploadedAt: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          uploadedBy: currentUser.name,
          status: res.status || "ready",
          summary: res.summary || `Extracted ${res.page_count || 1} page(s) from "${file.name}".`,
          keyPoints: [
            `Uploaded file: ${res.filename || file.name}`,
            `Pages extracted: ${res.page_count || 1}`,
            "Indexed and ready for context-grounded questions."
          ],
          recommendations: [
            "Ask questions in the chat panel to retrieve exact page citations."
          ]
        };
      }
    } catch {
      // Fallback to local metadata entry if backend is waking up
    }

    if (!uploadedDoc) {
      uploadedDoc = {
        id: `doc-${Date.now()}`,
        title: file.name || "Uploaded_Document.pdf",
        size: fileSizeLabel,
        pages: 1,
        uploadedAt: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        uploadedBy: currentUser.name,
        status: "ready",
        summary: `PDF "${file.name}" (${fileSizeLabel}) added. Re-upload when backend is awake for full PyMuPDF text extraction.`,
        keyPoints: [`File "${file.name}" uploaded from local device.`],
        recommendations: ["Ask questions about this PDF in the chat panel."]
      };
    }

    setDocuments(prev => {
      const next = [uploadedDoc, ...prev.filter(d => d.id !== uploadedDoc.id)];
      writeStorage(STORAGE_KEYS.documents, next);
      return next;
    });
    setSelectedDocId(uploadedDoc.id);
    showToast(`"${uploadedDoc.title}" uploaded and ready across your workspace!`);
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

  // Reports (starts empty; generated from the user's uploaded dataset)
  const [reports, setReports] = useState(() => {
    const saved = readStorage(STORAGE_KEYS.reports, []);
    const deletedIds = new Set(readStorage(STORAGE_KEYS.deletedReportIds, []));
    return Array.isArray(saved) ? saved.filter(r => !deletedIds.has(r.id)) : [];
  });

  const generateReportFromData = async (name, category = "Executive MIS") => {
    if (!dataset || dataset.length === 0) {
      showToast('Please upload a CSV or Excel dataset first before generating a report.', 'warning');
      return;
    }

    const baseDatasetName = (datasetName || 'Uploaded_Dataset').replace(/\.(csv|xlsx|xls)$/i, '');
    const reportFilename = name || `${baseDatasetName}_MIS_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const tempId = `rep-${Date.now()}`;

    const cols = Object.keys(dataset[0] || {});
    const numericCols = datasetAnalysis.numericColumns || [];
    const primaryMetricCol = numericCols.find((c) => !/^(id|.*_id|sr_?no|index)$/i.test(c)) || numericCols[0];

    const dynamicKpis = [`Records: ${dataset.length}`, `Columns: ${cols.length}`];
    if (primaryMetricCol) {
      const sum = dataset.reduce((acc, r) => acc + (typeof r[primaryMetricCol] === 'number' ? r[primaryMetricCol] : 0), 0);
      dynamicKpis.push(`Total ${primaryMetricCol}: ${sum.toLocaleString(undefined, { maximumFractionDigits: 1 })}`);
    }
    if (cleaningStats.missingValuesImputed > 0) {
      dynamicKpis.push(`Nulls Imputed: ${cleaningStats.missingValuesImputed}`);
    }

    const newRep = {
      id: tempId,
      name: reportFilename,
      category: category,
      format: reportFilename.toLowerCase().endsWith('.pdf') ? "PDF" : "Excel",
      size: "Pending...",
      generatedAt: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      generatedBy: currentUser.name,
      sourceDataset: datasetName,
      kpisIncluded: dynamicKpis,
      rowsSnapshot: dataset.slice(0, 500),
      downloadCount: 0
    };
    setReports(prev => {
      const next = [newRep, ...prev];
      writeStorage(STORAGE_KEYS.reports, next);
      return next;
    });
    showToast(`Generating report "${newRep.name}" from "${datasetName}"...`);

    try {
      const created = await api.generateReport({
        report_name: reportFilename,
        dataset_id: activeDatasetId,
        category,
        dataset_name: datasetName,
        rows: dataset.slice(0, 500),
        imputation_details: cleaningStats.imputationDetails || []
      });
      if (created?.id) {
        setReports(prev => {
          const updated = prev.map(r => (r.id === tempId ? { ...r, id: created.id, size: created.file_size || '14.2 KB' } : r));
          writeStorage(STORAGE_KEYS.reports, updated);
          return updated;
        });
      }
    } catch (e) {
      setReports(prev => {
        const updated = prev.map(r => (r.id === tempId ? { ...r, size: `${Math.max(1, Math.round(JSON.stringify(dataset).length / 1024))} KB` } : r));
        writeStorage(STORAGE_KEYS.reports, updated);
        return updated;
      });
    }
  };

  const downloadReport = async (report) => {
    if (!report) return;
    try {
      const res = await fetch(api.getReportDownloadUrl(report.id));
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = report.name || 'Executive_MIS_Report.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showToast(`Downloaded ${report.name}`);
        return;
      }
    } catch {
      // Fall back to exporting snapshot rows as CSV
    }

    const rowsToExport = report.rowsSnapshot?.length ? report.rowsSnapshot : dataset;
    if (rowsToExport && rowsToExport.length > 0) {
      const headers = Object.keys(rowsToExport[0]);
      const csvLines = [
        headers.join(','),
        ...rowsToExport.map(row =>
          headers.map(h => {
            const val = row[h] ?? '';
            const str = String(val);
            return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
          }).join(',')
        )
      ];
      const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (report.name || 'Report').replace(/\.(xlsx|xls|pdf)$/i, '') + '.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast(`Downloaded ${a.download}`);
    } else {
      showToast('Report file is no longer available on the server.', 'warning');
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
        clearDataset,
        loadUploadedDataset,
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
        downloadReport,
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
