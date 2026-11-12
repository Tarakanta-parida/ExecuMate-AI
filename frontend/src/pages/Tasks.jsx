import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  FolderPlus,
  Filter,
  Search,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  SlidersHorizontal,
  ChevronDown,
  X,
  Upload,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { mockUsers } from '../mockData';

export default function Tasks() {
  const {
    projects,
    addProject,
    tasks,
    addTask,
    updateTaskStatus,
    dataset,
    datasetName,
    documents,
    uploadDocument
  } = useApp();

  const [filterProject, setFilterProject] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'board'

  // Modal States
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);

  // New Task Form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskProject, setNewTaskProject] = useState(projects[0]?.id || '');
  const [newTaskAssignee, setNewTaskAssignee] = useState(mockUsers[0].name);
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // New Project Form
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectDueDate, setNewProjectDueDate] = useState('');

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchProj = filterProject === 'All' || t.projectId === filterProject;
      const matchStat = filterStatus === 'All' || t.status === filterStatus;
      const matchPrio = filterPriority === 'All' || t.priority === filterPriority;
      const matchSearch =
        searchQuery === '' ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());
      return matchProj && matchStat && matchPrio && matchSearch;
    });
  }, [tasks, filterProject, filterStatus, filterPriority, searchQuery]);

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const proj = projects.find(p => p.id === newTaskProject);

    addTask({
      title: newTaskTitle,
      description: newTaskDesc,
      projectId: newTaskProject,
      projectName: proj ? proj.name : "Strategic Operations",
      priority: newTaskPriority,
      assignedTo: newTaskAssignee,
      dueDate: newTaskDueDate || new Date().toISOString().slice(0, 10)
    });

    setNewTaskTitle('');
    setNewTaskDesc('');
    setIsNewTaskOpen(false);
  };

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    addProject({
      name: newProjectName,
      description: newProjectDesc,
      status: 'active',
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: newProjectDueDate || '2026-12-31'
    });

    setNewProjectName('');
    setNewProjectDesc('');
    setIsNewProjectOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1E293B] flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-[#2563EB]" />
            Projects & Task Management
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Coordinate cross-functional milestones, delegate deliverables, and track overdue assignments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#CBD5E1] hover:border-blue-300 text-[#1E293B] rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors">
            <Upload className="w-4 h-4 text-[#2563EB]" />
            <span>Upload File</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  await uploadDocument(file);
                  e.target.value = '';
                }
              }}
            />
          </label>

          <button
            onClick={() => setIsNewProjectOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#CBD5E1] hover:border-blue-300 text-[#1E293B] rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-[#2563EB]" />
            <span>New Project</span>
          </button>

          <button
            onClick={() => setIsNewTaskOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Uploaded Files Linked to Projects & Tasks */}
      {(dataset.length > 0 || documents.length > 0) && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
              Uploaded Files in Workspace
            </span>
            <span className="text-[11px] text-[#64748B]">
              Click a project card below to filter tasks linked to your uploaded files
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {dataset.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {datasetName} ({dataset.length} rows)
              </span>
            )}
            {documents.filter(d => !d.isDatasetDoc).map((doc) => (
              <span
                key={doc.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700"
              >
                <FileText className="w-3.5 h-3.5" />
                {doc.title} ({doc.pages}p)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Projects Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {projects.map((proj) => (
          <div
            key={proj.id}
            onClick={() => setFilterProject(filterProject === proj.id ? 'All' : proj.id)}
            className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${
              filterProject === proj.id
                ? 'border-[#2563EB] ring-2 ring-blue-500/10 shadow-sm'
                : 'border-[#E2E8F0] hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold text-[#1E293B] truncate" title={proj.name}>
                {proj.name}
              </span>
              <span
                className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                  proj.status === 'at_risk' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-[#2563EB]'
                }`}
              >
                {proj.status === 'at_risk' ? 'At Risk' : 'Active'}
              </span>
            </div>

            <p className="text-[11px] text-[#64748B] mt-1 line-clamp-2">{proj.description}</p>

            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-[#64748B]">Progress</span>
                <span className="text-[#1E293B]">{proj.progress}%</span>
              </div>
              <div className="w-full bg-[#F1F5F9] rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full ${proj.status === 'at_risk' ? 'bg-[#D97706]' : 'bg-[#2563EB]'}`}
                  style={{ width: `${proj.progress}%` }}
                />
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[10px] text-[#64748B]">
              <span>Lead: {proj.owner}</span>
              <span>Due: {proj.dueDate}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks, descriptions, or assignees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#1E293B] focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-[#1E293B] focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-[#1E293B] focus:outline-none"
          >
            <option value="All">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* View Toggle */}
          <div className="inline-flex rounded-lg border border-[#E2E8F0] p-0.5 bg-[#F8FAFC]">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-white text-[#2563EB] shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'board' ? 'bg-white text-[#2563EB] shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Task Content: Table or Kanban */}
      {viewMode === 'table' ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0] font-semibold">
                <tr>
                  <th className="py-3 px-4">Task Title</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#64748B]">
                      No tasks match current filters.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#1E293B]">{task.title}</div>
                        <div className="text-[11px] text-[#64748B] line-clamp-1 max-w-md">{task.description}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#334155]">{task.projectName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            task.priority === 'high'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : task.priority === 'medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`flex items-center gap-1.5 ${task.isOverdue && task.status !== 'completed' ? 'text-red-600 font-bold' : 'text-[#334155]'}`}>
                          {task.isOverdue && task.status !== 'completed' && <AlertCircle className="w-3.5 h-3.5 text-red-600" />}
                          <span>{task.dueDate}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#1E293B]">{task.assignedTo}</span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                          className={`text-xs font-semibold rounded-lg px-2 py-1 border transition-colors ${
                            task.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : task.status === 'in_progress'
                              ? 'bg-blue-50 text-[#2563EB] border-blue-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {task.status !== 'completed' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                            className="text-[11px] font-semibold text-[#2563EB] hover:underline"
                          >
                            Mark Done
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {['pending', 'in_progress', 'completed'].map((colStatus) => {
            const colTasks = filteredTasks.filter((t) => t.status === colStatus);
            const colLabel =
              colStatus === 'pending' ? 'To Do / Pending' : colStatus === 'in_progress' ? 'In Progress' : 'Completed';

            return (
              <div key={colStatus} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-3">
                  <span className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">{colLabel}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-[#E2E8F0] text-[#64748B]">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.map((task) => (
                    <div key={task.id} className="bg-white border border-[#E2E8F0] rounded-lg p-3.5 shadow-2xs space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            task.priority === 'high'
                              ? 'bg-red-50 text-red-700'
                              : task.priority === 'medium'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {task.priority}
                        </span>
                        {task.isOverdue && task.status !== 'completed' && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            OVERDUE
                          </span>
                        )}
                      </div>

                      <div className="font-semibold text-xs text-[#1E293B]">{task.title}</div>
                      <p className="text-[11px] text-[#64748B] line-clamp-2">{task.description}</p>

                      <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
                        <span>{task.assignedTo}</span>
                        <span>{task.dueDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Task Modal */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="font-bold text-sm text-[#1E293B]">Create Project Task</h3>
              <button onClick={() => setIsNewTaskOpen(false)} className="text-[#64748B] hover:text-[#1E293B]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audit Q3 Supplier Ledger Discrepancies"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">Project</label>
                <select
                  value={newTaskProject}
                  onChange={(e) => setNewTaskProject(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">Assignee</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none"
                  >
                    {mockUsers.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Specific requirements, deliverables, or checklist..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(false)}
                  className="px-3 py-2 rounded-lg border border-[#CBD5E1] text-[#64748B] hover:text-[#1E293B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold shadow-sm"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {isNewProjectOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="font-bold text-sm text-[#1E293B]">Create Strategic Project</h3>
              <button onClick={() => setIsNewProjectOpen(false)} className="text-[#64748B] hover:text-[#1E293B]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FY27 International Expansion"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">Target Completion Date</label>
                <input
                  type="date"
                  value={newProjectDueDate}
                  onChange={(e) => setNewProjectDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">Project Objective & Scope</label>
                <textarea
                  rows={3}
                  placeholder="Key milestones, primary stakeholders, and expected business outcome..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectOpen(false)}
                  className="px-3 py-2 rounded-lg border border-[#CBD5E1] text-[#64748B] hover:text-[#1E293B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold shadow-sm"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

