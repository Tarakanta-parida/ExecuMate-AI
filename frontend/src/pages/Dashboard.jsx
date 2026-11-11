import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  MessageSquare,
  Download,
  PlusCircle,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import KPICard from '../components/KPICard';
import { useApp } from '../context/AppContext';
import { mockDashboardKPIs, mockWeeklyPerformance } from '../mockData';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, tasks, updateTaskStatus, reports, projects, showToast } = useApp();

  const overdueTasks = tasks.filter(t => t.isOverdue && t.status !== 'completed');
  const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed');

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome & Executive Summary Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 md:p-8 text-white shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-medium mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
            Executive Intelligence Command Center
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-blue-100 text-xs md:text-sm max-w-2xl leading-relaxed">
            All systems operational. You have <span className="font-semibold text-white">{overdueTasks.length} overdue assignments</span> requiring management review, and <span className="font-semibold text-white">{reports.length} MIS reports</span> ready for download.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => navigate('/analytics')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur transition-colors border border-white/10"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-300" /> Clean my data
          </button>
          <button
            onClick={() => navigate('/research')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <MessageSquare className="w-4 h-4" /> Ask AI
          </button>
        </div>
      </div>

      {/* KPI Row (Module 01) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Projects"
          value={projects.length}
          change={mockDashboardKPIs.totalProjectsChange}
          changeType="positive"
          icon={FolderKanban}
          subtitle="portfolio active"
        />
        <KPICard
          title="Pending Tasks"
          value={tasks.filter(t => t.status === 'pending').length}
          change="14 in progress"
          changeType="neutral"
          icon={Clock}
          subtitle="team assignments"
        />
        <KPICard
          title="Overdue Tasks"
          value={overdueTasks.length}
          change={overdueTasks.length > 0 ? "Requires action" : "All on schedule"}
          changeType={overdueTasks.length > 0 ? "warning" : "positive"}
          icon={AlertCircle}
          badge={overdueTasks.length > 0 ? "Attention" : null}
          subtitle="past deadline"
        />
        <KPICard
          title="Generated MIS Reports"
          value={reports.length}
          change="+12 this week"
          changeType="positive"
          icon={FileSpreadsheet}
          subtitle="Excel & PDF assets"
        />
      </div>

      {/* Analytics & Performance Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">Weekly Performance & MIS Output</h2>
              <p className="text-xs text-[#64748B]">Velocity of task completion vs automated report generation</p>
            </div>
            <span className="text-xs font-medium text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-md">
              Last 7 Days
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockWeeklyPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="taskColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="reportColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="tasksDone" name="Tasks Completed" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#taskColor)" />
                <Area type="monotone" dataKey="reportsGenerated" name="MIS Reports Created" stroke="#16A34A" strokeWidth={2} fillOpacity={1} fill="url(#reportColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Health / Portfolio Status */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#1E293B]">Project Progress</h2>
              <button
                onClick={() => navigate('/tasks')}
                className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-4">
              {projects.map((proj) => (
                <div key={proj.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#1E293B] truncate max-w-[180px]">{proj.name}</span>
                    <span className="font-medium text-[#64748B]">{proj.progress}%</span>
                  </div>
                  <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        proj.status === 'at_risk' ? 'bg-[#D97706]' : 'bg-[#2563EB]'
                      }`}
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#64748B]">
                    <span>Lead: {proj.owner}</span>
                    <span>Due {proj.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/tasks')}
            className="w-full mt-4 py-2 border border-dashed border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#2563EB] hover:border-blue-300 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Create New Project
          </button>
        </div>
      </div>

      {/* Bottom Section: Urgent Tasks & Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent & Overdue Assignments */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">Urgent & Priority Assignments</h2>
              <p className="text-xs text-[#64748B]">Assignments requiring management attention</p>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs text-[#2563EB] hover:underline font-semibold"
            >
              Manage Tasks
            </button>
          </div>

          <div className="divide-y divide-[#E2E8F0]">
            {tasks.slice(0, 4).map((task) => (
              <div key={task.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        task.priority === 'high'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : task.priority === 'medium'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span className="font-semibold text-[#1E293B]">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#64748B] text-[11px]">
                    <span>Assigned: {task.assignedTo}</span>
                    <span>•</span>
                    <span className={task.isOverdue && task.status !== 'completed' ? 'text-red-600 font-semibold' : ''}>
                      Due: {task.dueDate} {task.isOverdue && task.status !== 'completed' ? '(Overdue)' : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {task.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle className="w-3 h-3" /> Done
                    </span>
                  ) : (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'completed')}
                      className="px-2 py-1 text-[11px] font-medium text-[#2563EB] hover:bg-blue-50 border border-blue-200 rounded transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Generated Reports */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">Recent MIS Reports</h2>
              <p className="text-xs text-[#64748B]">Ready-to-use business intelligence deliverables</p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs text-[#2563EB] hover:underline font-semibold"
            >
              All Reports
            </button>
          </div>

          <div className="divide-y divide-[#E2E8F0]">
            {reports.slice(0, 4).map((report) => (
              <div key={report.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center font-bold text-xs shrink-0">
                    XLS
                  </div>
                  <div>
                    <div className="font-semibold text-[#1E293B] truncate max-w-[220px]">{report.name}</div>
                    <div className="text-[11px] text-[#64748B]">
                      {report.category} • {report.size} • {report.generatedAt}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => showToast(`Downloading ${report.name}...`)}
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#2563EB] hover:bg-blue-50 transition-colors"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

