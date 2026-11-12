// ExecuMate AI API Client
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const defaultHeaders = isFormData ? {} : { 'Content-Type': 'application/json' };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP Error ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.warn(`[ExecuMate API Fallback] ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => request('/auth/me'),
  updateProfile: (profileData) =>
    request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  // Dashboard
  getDashboardSummary: () => request('/dashboard/summary'),

  // Projects
  getProjects: () => request('/projects'),
  createProject: (projectData) =>
    request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    }),

  // Tasks
  getTasks: () => request('/tasks'),
  createTask: (taskData) =>
    request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),
  updateTask: (taskId, updates) =>
    request(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  // Documents
  getDocuments: () => request('/documents'),
  deleteDocument: (docId) =>
    request(`/documents/${docId}`, {
      method: 'DELETE',
    }),
  askDocumentQuestion: (docId, question) =>
    request(`/documents/${docId}/ask`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
  summarizeDocument: (docId) =>
    request(`/documents/${docId}/summarize`, {
      method: 'POST',
    }),

  // Data Analytics
  uploadDataset: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/data/upload', {
      method: 'POST',
      body: formData,
    });
  },
  cleanDataset: (datasetId, strategy = 'auto') =>
    request(`/data/${datasetId}/clean?strategy=${encodeURIComponent(strategy)}`, {
      method: 'POST',
    }),
  previewDataset: (datasetId) => request(`/data/${datasetId}/preview`),

  // Reports
  getReports: () => request('/reports'),
  deleteReport: (reportId) =>
    request(`/reports/${reportId}`, {
      method: 'DELETE',
    }),
  generateReport: (reportName, category = 'Executive MIS') =>
    request('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ report_name: reportName, category }),
    }),

  // Automation
  getWorkflows: () => request('/automation/workflows'),
  triggerWorkflow: (workflowId) =>
    request('/automation/trigger', {
      method: 'POST',
      body: JSON.stringify({ workflow_id: workflowId }),
    }),
  getAutomationLogs: () => request('/automation/logs'),
};
