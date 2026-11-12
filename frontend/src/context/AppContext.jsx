import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
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
  parseCsvText,
  buildDatasetDocumentInsight,
  answerDatasetQuestion
} from '../utils/dataCleaning';
import {
  saveActiveDatasetToIDB,
  loadActiveDatasetFromIDB,
  clearActiveDatasetFromIDB
} from '../utils/datasetStorage';

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
  isDataCleaned: 'execumate_is_data_cleaned_v2',
  datasetCleared: 'execumate_dataset_cleared_v2',
  projects: 'execumate_projects_v2',
  tasks: 'execumate_tasks_v2'
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

function removeStorage(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}

function writeReportsStorage(reportsList) {
  const slimmed = Array.isArray(reportsList)
    ? reportsList.map((r) =>
        Array.isArray(r.rowsSnapshot) && r.rowsSnapshot.length > 25
          ? { ...r, rowsSnapshot: r.rowsSnapshot.slice(0, 25) }
          : r
      )
    : [];
  writeStorage(STORAGE_KEYS.reports, slimmed);
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

  // Projects & Tasks (persisted so file-derived projects & tasks survive refresh)
  const [projects, setProjects] = useState(() => readStorage(STORAGE_KEYS.projects, mockProjects));
  const [tasks, setTasks] = useState(() => readStorage(STORAGE_KEYS.tasks, mockTasks));
  const hasUserTouchedDatasetRef = useRef(false);

  // Sync with FastAPI backend on load
  useEffect(() => {
    async function hydratePersistedDataset() {
      try {
        if (readStorage(STORAGE_KEYS.datasetCleared, false) === true) {
          return;
        }
        const cached = await loadActiveDatasetFromIDB();
        if (!hasUserTouchedDatasetRef.current && cached && (cached.dataset?.length > 0 || cached.rawDataset?.length > 0)) {
          const cachedRaw = Array.isArray(cached.rawDataset) && cached.rawDataset.length > 0 ? cached.rawDataset : cached.dataset;
          const cachedData = Array.isArray(cached.dataset) && cached.dataset.length > 0 ? cached.dataset : cachedRaw;
          setRawDataset(cachedRaw);
          setDataset(cachedData);
          setDatasetName(cached.datasetName || '');
          setActiveDatasetId(cached.datasetId || null);
          setIsDataCleaned(Boolean(cached.isDataCleaned));
          if (cached.imputationStrategy) {
            setImputationStrategy(cached.imputationStrategy);
          }
          if (cached.cleaningStats) {
            setCleaningStats(cached.cleaningStats);
          }
          return;
        }

        if (!hasUserTouchedDatasetRef.current) {
          const latest = await api.getLatestDataset();
          if (!hasUserTouchedDatasetRef.current && latest && Array.isArray(latest.rows) && latest.rows.length > 0) {
            const strategy = 'auto';
            const cleaned = cleanDatasetRows(latest.rows, strategy);
            const nextStats = {
              duplicatesRemoved: cleaned.duplicatesRemoved,
              missingValuesImputed: cleaned.missingValuesImputed,
              initialRows: cleaned.initialRows,
              currentRows: cleaned.currentRows,
              cleanQualityScore: cleaned.cleanQualityScore,
              strategy,
              imputationDetails: cleaned.imputationDetails
            };
            setRawDataset(latest.rows);
            setDataset(cleaned.cleanedRows);
            setDatasetName(latest.filename || 'Uploaded Dataset');
            setActiveDatasetId(latest.id || null);
            setIsDataCleaned(true);
            setCleaningStats(nextStats);
            writeStorage(STORAGE_KEYS.datasetName, latest.filename || 'Uploaded Dataset');
            writeStorage(STORAGE_KEYS.datasetId, latest.id || null);
            writeStorage(STORAGE_KEYS.isDataCleaned, true);
            writeStorage(STORAGE_KEYS.cleaningStats, nextStats);
            saveActiveDatasetToIDB({
              rawDataset: latest.rows,
              dataset: cleaned.cleanedRows,
              datasetName: latest.filename || 'Uploaded Dataset',
              datasetId: latest.id || null,
              isDataCleaned: true,
              imputationStrategy: strategy,
              cleaningStats: nextStats
            });
          }
        }
      } catch {
        // Keep current dataset state
      }
    }

    hydratePersistedDataset();

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
          setProjects(prev => {
            const merged = [
              ...prev.filter(pp => pp.sourceFile),
              ...formatted,
              ...prev.filter(pp => !pp.sourceFile && !formatted.some(fp => fp.id === pp.id))
            ];
            writeStorage(STORAGE_KEYS.projects, merged);
            return merged;
          });
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
          setTasks(prev => {
            const merged = [...prev.filter(pt => pt.sourceFile), ...formattedTasks, ...prev.filter(pt => !pt.sourceFile && !formattedTasks.some(ft => ft.id === pt.id))];
            writeStorage(STORAGE_KEYS.tasks, merged);
            return merged;
          });
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
            writeReportsStorage(merged);
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
    setProjects(prev => {
      const next = [proj, ...prev];
      writeStorage(STORAGE_KEYS.projects, next);
      return next;
    });
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
    setTasks(prev => {
      const next = [task, ...prev];
      writeStorage(STORAGE_KEYS.tasks, next);
      return next;
    });
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
    setTasks(prev => {
      const next = prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t));
      writeStorage(STORAGE_KEYS.tasks, next);
      return next;
    });
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

    hasUserTouchedDatasetRef.current = true;
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
    writeStorage(STORAGE_KEYS.datasetCleared, false);
    writeStorage(STORAGE_KEYS.isDataCleaned, true);
    writeStorage(STORAGE_KEYS.cleaningStats, nextStats);
    removeStorage(STORAGE_KEYS.dataset);
    saveActiveDatasetToIDB({
      rawDataset,
      dataset: result.cleanedRows,
      datasetName,
      datasetId: activeDatasetId,
      isDataCleaned: true,
      imputationStrategy: activeStrategy,
      cleaningStats: nextStats
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
    hasUserTouchedDatasetRef.current = true;
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
    writeStorage(STORAGE_KEYS.datasetCleared, false);
    writeStorage(STORAGE_KEYS.isDataCleaned, false);
    writeStorage(STORAGE_KEYS.cleaningStats, emptyStats);
    removeStorage(STORAGE_KEYS.dataset);
    saveActiveDatasetToIDB({
      rawDataset,
      dataset: rawDataset,
      datasetName,
      datasetId: activeDatasetId,
      isDataCleaned: false,
      imputationStrategy,
      cleaningStats: emptyStats
    });
    showToast('Dataset reset to original uploaded raw file.', 'info');
  };

  const clearDataset = () => {
    hasUserTouchedDatasetRef.current = true;
    const prevDatasetId = activeDatasetId;
    const prevDatasetName = datasetName;

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

    writeStorage(STORAGE_KEYS.datasetCleared, true);
    removeStorage(STORAGE_KEYS.rawDataset);
    removeStorage(STORAGE_KEYS.dataset);
    removeStorage(STORAGE_KEYS.datasetName);
    removeStorage(STORAGE_KEYS.datasetId);
    removeStorage(STORAGE_KEYS.isDataCleaned);
    removeStorage(STORAGE_KEYS.cleaningStats);
    clearActiveDatasetFromIDB();

    if (prevDatasetName) {
      const expectedDocId = `dataset-doc-${prevDatasetName}`;
      setDocuments(prev => {
        const next = prev.filter(d => d.id !== expectedDocId && !(d.isDatasetDoc && d.title === prevDatasetName));
        writeStorage(STORAGE_KEYS.documents, next);
        return next;
      });
      setProjects(prev => {
        const next = prev.filter(p => p.sourceFile !== prevDatasetName);
        writeStorage(STORAGE_KEYS.projects, next);
        return next;
      });
      setTasks(prev => {
        const next = prev.filter(t => t.sourceFile !== prevDatasetName);
        writeStorage(STORAGE_KEYS.tasks, next);
        return next;
      });
    }

    if (prevDatasetId) {
      api.deleteDataset(prevDatasetId).catch(() => {});
    }

    showToast('Uploaded dataset deleted.', 'info');
  };

  const [isDatasetUploading, setIsDatasetUploading] = useState(false);

  const syncFileAcrossProjectsAndTasks = ({ fileName, fileType, rowCount = 0, nullsImputed = 0, rows = [] }) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const projectId = `proj-file-${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    const newProj = {
      id: projectId,
      name: `${fileType}: ${fileName}`,
      owner: currentUser.name,
      status: 'active',
      progress: fileType === 'PDF' ? 50 : 75,
      startDate: todayStr,
      dueDate: todayStr,
      description:
        fileType === 'PDF'
          ? `Uploaded PDF indexed in AI Research Assistant & Executive Briefings.`
          : `Uploaded ${fileType} dataset (${rowCount} rows, ${nullsImputed} nulls imputed) synced across Analytics, Research & Reports.`,
      sourceFile: fileName,
      fileType,
      tasksTotal: 2,
      tasksCompleted: fileType === 'PDF' ? 1 : 1
    };

    setProjects(prev => {
      const next = [newProj, ...prev.filter(p => p.id !== projectId && p.sourceFile !== fileName)];
      writeStorage(STORAGE_KEYS.projects, next);
      return next;
    });

    // If the uploaded spreadsheet has task-like rows, also import up to 10 tasks directly
    const importedTasks = [];
    if (rows && rows.length > 0) {
      const cols = Object.keys(rows[0]);
      const titleCol = cols.find(c => /^(title|task|task_name|deliverable|action|item)$/i.test(c));
      if (titleCol) {
        const prioCol = cols.find(c => /^(priority)$/i.test(c));
        const statusCol = cols.find(c => /^(status)$/i.test(c));
        const assigneeCol = cols.find(c => /^(assigned_?to|assignee|owner)$/i.test(c));
        const dueCol = cols.find(c => /^(due_?date|deadline|date)$/i.test(c));
        rows.slice(0, 10).forEach((r, idx) => {
          if (!r[titleCol]) return;
          importedTasks.push({
            id: `task-file-${projectId}-${idx}`,
            projectId,
            projectName: newProj.name,
            title: String(r[titleCol]),
            description: `Imported from uploaded file "${fileName}".`,
            priority: ['high', 'medium', 'low'].includes(String(r[prioCol] || '').toLowerCase())
              ? String(r[prioCol]).toLowerCase()
              : 'medium',
            status: ['pending', 'in_progress', 'completed'].includes(String(r[statusCol] || '').toLowerCase())
              ? String(r[statusCol]).toLowerCase()
              : 'pending',
            assignedTo: r[assigneeCol] ? String(r[assigneeCol]) : currentUser.name,
            dueDate: r[dueCol] ? String(r[dueCol]) : todayStr,
            isOverdue: false,
            sourceFile: fileName
          });
        });
      }
    }

    const defaultFileTasks =
      importedTasks.length > 0
        ? importedTasks
        : [
            {
              id: `task-file-${projectId}-1`,
              projectId,
              projectName: newProj.name,
              title: fileType === 'PDF' ? `Review AI Summary: ${fileName}` : `Audit & Verify Dataset: ${fileName}`,
              description:
                fileType === 'PDF'
                  ? `Inspect extracted key findings and ask grounded questions in AI Research Assistant.`
                  : `Reviewed ${rowCount} rows (${nullsImputed} missing numerical cells imputed).`,
              priority: 'high',
              status: 'in_progress',
              assignedTo: currentUser.name,
              dueDate: todayStr,
              isOverdue: false,
              sourceFile: fileName
            },
            {
              id: `task-file-${projectId}-2`,
              projectId,
              projectName: newProj.name,
              title: `Share Report for ${fileName}`,
              description: `Download and distribute the generated Executive Insights deliverable from Reports.`,
              priority: 'medium',
              status: 'pending',
              assignedTo: currentUser.name,
              dueDate: todayStr,
              isOverdue: false,
              sourceFile: fileName
            }
          ];

    setTasks(prev => {
      const next = [...defaultFileTasks, ...prev.filter(t => t.sourceFile !== fileName)];
      writeStorage(STORAGE_KEYS.tasks, next);
      return next;
    });
  };

  const generateReportFromDatasetSnapshot = async (targetRows, targetName, targetDatasetId, targetStats, customReportName, category = "Executive MIS") => {
    if (!targetRows || targetRows.length === 0) return null;

    const baseDatasetName = (targetName || 'Uploaded_Dataset').replace(/\.(csv|xlsx|xls)$/i, '');
    const reportFilename = customReportName || `${baseDatasetName}_MIS_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const tempId = `rep-${Date.now()}`;

    const cols = Object.keys(targetRows[0] || {});
    const targetAnalysis = analyzeDatasetRows(targetRows);
    const numericCols = targetAnalysis.numericColumns || [];
    const primaryMetricCol = numericCols.find((c) => !/^(id|.*_id|sr_?no|index)$/i.test(c)) || numericCols[0];

    const dynamicKpis = [`Records: ${targetRows.length}`, `Columns: ${cols.length}`];
    if (primaryMetricCol) {
      const sum = targetRows.reduce((acc, r) => acc + (typeof r[primaryMetricCol] === 'number' ? r[primaryMetricCol] : 0), 0);
      dynamicKpis.push(`Total ${primaryMetricCol}: ${sum.toLocaleString(undefined, { maximumFractionDigits: 1 })}`);
    }
    if (targetStats?.missingValuesImputed > 0) {
      dynamicKpis.push(`Nulls Imputed: ${targetStats.missingValuesImputed}`);
    }

    const newRep = {
      id: tempId,
      name: reportFilename,
      category,
      format: reportFilename.toLowerCase().endsWith('.pdf') ? "PDF" : "Excel",
      size: `${Math.max(1, Math.round(JSON.stringify(targetRows).length / 1024))} KB`,
      generatedAt: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      generatedBy: currentUser.name,
      sourceDataset: targetName,
      kpisIncluded: dynamicKpis,
      rowsSnapshot: targetRows.slice(0, 200),
      downloadCount: 0
    };

    setReports(prev => {
      const next = [newRep, ...prev.filter(r => !(r.sourceDataset === targetName && !customReportName))];
      writeReportsStorage(next);
      return next;
    });

    let finalRep = { ...newRep, rowsSnapshot: targetRows };
    try {
      const created = await api.generateReport({
        report_name: reportFilename,
        dataset_id: targetDatasetId,
        category,
        dataset_name: targetName,
        rows: targetRows,
        imputation_details: targetStats?.imputationDetails || []
      });
      if (created?.id) {
        finalRep = { ...finalRep, id: created.id, size: created.file_size || finalRep.size };
        setReports(prev => {
          const updated = prev.map(r => (r.id === tempId ? { ...r, id: created.id, size: created.file_size || r.size } : r));
          writeReportsStorage(updated);
          return updated;
        });
      }
    } catch {
      // Snapshot report already persisted in localStorage
    }
    return finalRep;
  };

  const applyDatasetRows = (rows, fileName, uploadedDatasetId = null) => {
    hasUserTouchedDatasetRef.current = true;
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

    writeStorage(STORAGE_KEYS.datasetCleared, false);
    removeStorage(STORAGE_KEYS.rawDataset);
    removeStorage(STORAGE_KEYS.dataset);
    writeStorage(STORAGE_KEYS.datasetName, fileName);
    writeStorage(STORAGE_KEYS.datasetId, uploadedDatasetId);
    writeStorage(STORAGE_KEYS.isDataCleaned, true);
    writeStorage(STORAGE_KEYS.cleaningStats, nextStats);
    saveActiveDatasetToIDB({
      rawDataset: rows,
      dataset: cleaned.cleanedRows,
      datasetName: fileName,
      datasetId: uploadedDatasetId,
      isDataCleaned: true,
      imputationStrategy,
      cleaningStats: nextStats
    });

    // 1. Sync uploaded CSV/Excel into AI Research Assistant
    const datasetDoc = buildDatasetDocumentInsight(cleaned.cleanedRows, fileName, nextStats);
    datasetDoc.uploadedBy = currentUser.name;
    setDocuments(prev => {
      const next = [datasetDoc, ...prev.filter(d => d.id !== datasetDoc.id)];
      writeStorage(STORAGE_KEYS.documents, next);
      return next;
    });
    setSelectedDocId(datasetDoc.id);

    // 2. Sync uploaded file into Projects & Task Management
    syncFileAcrossProjectsAndTasks({
      fileName,
      fileType: fileName.toLowerCase().endsWith('.csv') ? 'CSV' : 'Excel',
      rowCount: cleaned.currentRows,
      nullsImputed: cleaned.missingValuesImputed,
      rows: cleaned.cleanedRows
    });

    // 3. Auto-generate report in Reports & Executive Insights
    generateReportFromDatasetSnapshot(cleaned.cleanedRows, fileName, uploadedDatasetId, nextStats);

    const summaryText = cleaned.imputationDetails
      .filter((d) => d.isNumeric)
      .map((d) => `${d.column} -> ${d.value} (${d.method})`)
      .join(', ');
    showToast(
      summaryText
        ? `Loaded "${fileName}" across all sections and replaced ${cleaned.missingValuesImputed} nulls (${summaryText}).`
        : `Loaded "${fileName}" (${cleaned.currentRows} rows) across Analytics, AI Research, Projects & Reports.`,
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
                if (readStorage(STORAGE_KEYS.datasetCleared, false) === true) {
                  api.deleteDataset(uploaded.id).catch(() => {});
                  return;
                }
                setActiveDatasetId(uploaded.id);
                writeStorage(STORAGE_KEYS.datasetId, uploaded.id);
                loadActiveDatasetFromIDB().then((existing) => {
                  if (existing && existing.datasetName === file.name) {
                    saveActiveDatasetToIDB({ ...existing, datasetId: uploaded.id });
                  }
                });
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
    const isDataset = selectedDocument.isDatasetDoc;

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

    if (isDataset) {
      const dsRes = answerDatasetQuestion(question, dataset, datasetName || targetDocTitle, cleaningStats);
      aiResponse = dsRes.answer;
      citations = dsRes.citations;
    } else {
      try {
        const apiRes = await api.askDocumentQuestion(targetDocId, question);
        if (apiRes?.answer) {
          aiResponse = apiRes.answer;
          citations = apiRes.citations || [];
        }
      } catch {
        // Fallback below using uploaded document's extracted summary
      }
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
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.csv') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      await loadUploadedDataset(file);
      return;
    }

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
          docType: 'PDF',
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
        docType: 'PDF',
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

    // Sync uploaded PDF into Projects & Task Management
    syncFileAcrossProjectsAndTasks({
      fileName: uploadedDoc.title,
      fileType: 'PDF'
    });

    // Also create a corresponding Executive Briefing entry in Reports & Executive Insights
    const pdfReport = {
      id: `rep-pdf-${uploadedDoc.id}`,
      docId: uploadedDoc.id,
      name: uploadedDoc.title,
      category: 'Executive Briefing',
      format: 'PDF',
      size: uploadedDoc.size,
      generatedAt: uploadedDoc.uploadedAt,
      generatedBy: currentUser.name,
      sourceDataset: uploadedDoc.title,
      summarySnapshot: uploadedDoc.summary,
      kpisIncluded: [`${uploadedDoc.pages} Pages`, 'AI Extracted Summary', 'Grounded Citations'],
      downloadCount: 0
    };
    setReports(prev => {
      const next = [pdfReport, ...prev.filter(r => r.id !== pdfReport.id)];
      writeStorage(STORAGE_KEYS.reports, next);
      return next;
    });

    showToast(`"${uploadedDoc.title}" uploaded and visible across AI Research, Projects & Reports!`);
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

  const exportRowsAsCsv = (rowsToExport, filename) => {
    if (!rowsToExport || rowsToExport.length === 0) {
      showToast('No dataset rows available to export.', 'warning');
      return false;
    }
    const headers = Object.keys(rowsToExport[0]);
    const csvLines = [
      headers.join(','),
      ...rowsToExport.map(row =>
        headers.map(h => {
          const val = row[h] ?? '';
          const str = String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(',')
      )
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`);
    return true;
  };

  const exportCleanedCsv = (customRows, customName) => {
    const rowsToExport = customRows && customRows.length > 0 ? customRows : dataset;
    const baseName = (customName || datasetName || 'Analyzed_Dataset').replace(/\.(csv|xlsx|xls)$/i, '');
    exportRowsAsCsv(rowsToExport, `${baseName}_cleaned.csv`);
  };

  const generateReportFromData = async (name, category = "Executive MIS", autoDownload = false) => {
    if (!dataset || dataset.length === 0) {
      showToast('Please upload a CSV or Excel dataset first before generating a report.', 'warning');
      return;
    }
    if (autoDownload) {
      showToast(`Preparing analyzed report for "${datasetName}"...`, 'info');
    }
    const createdRep = await generateReportFromDatasetSnapshot(
      dataset,
      datasetName,
      activeDatasetId,
      cleaningStats,
      name,
      category
    );
    if (createdRep) {
      if (autoDownload) {
        await downloadReport(createdRep);
      } else {
        showToast(`Report "${createdRep.name}" generated from "${datasetName}"!`);
      }
    }
  };

  const downloadReport = async (report) => {
    if (!report) return;
    if (report.docId) {
      try {
        const res = await fetch(api.getDocumentDownloadUrl(report.docId));
        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = report.name || 'Document.pdf';
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          showToast(`Downloaded ${report.name}`);
          return;
        }
      } catch {
        // Fallback below
      }
      if (report.summarySnapshot) {
        const blob = new Blob([`${report.name}\n\n${report.summarySnapshot}`], { type: 'text/plain;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.name}_summary.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showToast(`Downloaded ${a.download}`);
        return;
      }
    }

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
    if (!exportRowsAsCsv(rowsToExport, (report.name || 'Report').replace(/\.(xlsx|xls|pdf)$/i, '') + '.csv')) {
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
        exportCleanedCsv,
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
