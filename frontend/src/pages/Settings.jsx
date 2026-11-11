import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Cpu,
  Key,
  Database,
  Save,
  CheckCircle2,
  Lock,
  UserPlus,
  UserCheck,
  Building2,
  Briefcase,
  Mail,
  RefreshCw,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const {
    currentUser,
    users,
    setCurrentUser,
    updateUserProfile,
    createUserProfile,
    showToast
  } = useApp();

  // Profile Form States
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [role, setRole] = useState(currentUser.role);
  const [department, setDepartment] = useState(currentUser.department);
  const [jobTitle, setJobTitle] = useState(currentUser.role === 'Director' ? 'Managing Director' : currentUser.role);

  // Synchronize inputs when currentUser changes (e.g. from persona switch)
  useEffect(() => {
    setName(currentUser.name);
    setEmail(currentUser.email);
    setRole(currentUser.role);
    setDepartment(currentUser.department);
    setJobTitle(currentUser.role === 'Director' ? 'Managing Director' : currentUser.role);
  }, [currentUser]);

  // Modal State for Creating a Brand New Profile
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileEmail, setNewProfileEmail] = useState('');
  const [newProfileRole, setNewProfileRole] = useState('Director');
  const [newProfileDept, setNewProfileDept] = useState('Executive Board');

  // AI & Database settings
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('sk-live-••••••••••••••••3a9f');
  const [dbHost, setDbHost] = useState('postgresql://postgres@localhost:5432/execumate_db');
  const [vectorEmbeddingsModel, setVectorEmbeddingsModel] = useState('text-embedding-004');

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateUserProfile({
      name,
      email,
      role,
      department,
      jobTitle
    });
  };

  const handleCreateNewProfile = (e) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    createUserProfile({
      name: newProfileName,
      email: newProfileEmail || `${newProfileName.toLowerCase().replace(/\s+/g, '.')}@execumate.ai`,
      role: newProfileRole,
      department: newProfileDept
    });

    setNewProfileName('');
    setNewProfileEmail('');
    setIsCreateModalOpen(false);
  };

  const handleSaveAll = (e) => {
    e.preventDefault();
    updateUserProfile({
      name,
      email,
      role,
      department,
      jobTitle
    });
    showToast('Platform preferences, LLM connectors, and user profile saved successfully.');
  };

  // Helper description of the role responsibilities (from PRD Section 1.3)
  const getRoleResponsibilities = (r) => {
    switch (r) {
      case 'Director':
        return {
          title: 'Executive Leadership Mode',
          desc: 'Prioritizes overall portfolio health, board briefings, executive summaries, and high-level MIS report analysis.',
          badge: 'Executive Oversight'
        };
      case 'Manager':
        return {
          title: 'Operations & Project Management Mode',
          desc: 'Focuses on task allocations, milestone tracking, deadline escalation alerts, and team workload balances.',
          badge: 'Project Tracking'
        };
      case 'Data Analyst':
        return {
          title: 'MIS & Business Intelligence Mode',
          desc: 'Specialized for raw spreadsheet ingestion, data auditing, null-imputation, and automated Excel reporting.',
          badge: 'MIS & Analytics'
        };
      case 'Research Assistant':
        return {
          title: 'Document Intelligence Mode',
          desc: 'Tailored for PDF document synthesis, PyMuPDF chunk extraction, and grounded AI questions with citations.',
          badge: 'Document Intelligence'
        };
      default:
        return {
          title: 'Custom Persona Mode',
          desc: 'Configured with custom department access and cross-functional reporting tools.',
          badge: 'Custom Persona'
        };
    }
  };

  const roleInfo = getRoleResponsibilities(role);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1E293B] flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-[#2563EB]" />
            Platform Settings & Configuration
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Build and customize your user profile, LLM connectors, and PostgreSQL database preferences
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#2563EB] border border-blue-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Build New User Profile</span>
        </button>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-5">
          {/* Header & Persona Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm ring-4 ring-blue-50">
                {currentUser.initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-[#1E293B]">{currentUser.name}</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
                    Active Persona
                  </span>
                </div>
                <p className="text-xs text-[#64748B]">{currentUser.role} • {currentUser.department}</p>
              </div>
            </div>

            {/* Switch Active User Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#64748B] flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-[#2563EB]" /> Switch Profile:
              </span>
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const found = (users || []).find(u => u.id === e.target.value);
                  if (found) setCurrentUser(found);
                }}
                className="text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-[#1E293B] font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {(users || []).map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Role Responsibilities Callout */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-3.5 flex items-start gap-3">
            <UserCheck className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1E293B]">{roleInfo.title}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-white px-2 py-0.5 rounded border border-blue-200">
                  {roleInfo.badge}
                </span>
              </div>
              <p className="text-[#475569] leading-relaxed">{roleInfo.desc}</p>
            </div>
          </div>

          {/* Editable Profile Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Corporate Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sarah.jenkins@execumate.ai"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Assigned Role *</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[#1E293B] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] cursor-pointer"
                >
                  <option value="Director">Director (Executive Overview & Summaries)</option>
                  <option value="Manager">Manager (Task Tracking & Updates)</option>
                  <option value="Data Analyst">Data Analyst (Data Processing & MIS)</option>
                  <option value="Research Assistant">Research Assistant (Document Research & RAG)</option>
                  <option value="Vice President">Vice President (Operations & Strategy)</option>
                  <option value="Executive Officer">Executive Officer (C-Suite)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Department *</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-[#1E293B] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] cursor-pointer"
                >
                  <option value="Executive Board">Executive Board</option>
                  <option value="Operations & Delivery">Operations & Delivery</option>
                  <option value="MIS & Analytics">MIS & Analytics</option>
                  <option value="Strategic Intelligence">Strategic Intelligence</option>
                  <option value="Finance & Accounting">Finance & Accounting</option>
                  <option value="Engineering & Technology">Engineering & Technology</option>
                  <option value="Legal & Governance">Legal & Governance</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-[#64748B]">
              Changes to this profile immediately reflect in the Navbar, Sidebar, Dashboard, and Reports.
            </span>
            <button
              type="button"
              onClick={handleSaveProfile}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </div>

        {/* AI & RAG Configuration */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
            <Cpu className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#1E293B]">AI & Vector Search Connectors (TRD 2.4)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Primary LLM Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="gemini">Google Gemini 1.5 / 2.0 (Recommended)</option>
                <option value="openai">OpenAI GPT-4o / Mini</option>
                <option value="anthropic">Anthropic Claude 3.5 Sonnet</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Embedding Engine</label>
              <input
                type="text"
                value={vectorEmbeddingsModel}
                onChange={(e) => setVectorEmbeddingsModel(e.target.value)}
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg bg-white focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-[#1E293B] mb-1 flex items-center justify-between">
                <span>API Secret Key</span>
                <span className="text-[10px] text-[#64748B] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" /> Stored encrypted via AES-256
                </span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Database & Storage */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
            <Database className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#1E293B]">PostgreSQL & pgvector Configuration (TRD 5.1)</h2>
          </div>

          <div className="text-xs space-y-3">
            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Database Connection String</label>
              <input
                type="text"
                value={dbHost}
                onChange={(e) => setDbHost(e.target.value)}
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg bg-white font-mono text-[11px]"
              />
            </div>
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>pgvector extension is activated on schema `execumate_db`.</span>
            </div>
          </div>
        </div>

        {/* Save All Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save All Preferences</span>
          </button>
        </div>
      </form>

      {/* Build New User Profile Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1E293B]">Build Custom User Profile</h3>
                  <p className="text-[11px] text-[#64748B]">Create a tailored persona for your workflow</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#64748B] hover:text-[#1E293B] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewProfile} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1E293B] mb-1">Work Email</label>
                <input
                  type="email"
                  placeholder="e.g. alex.morgan@execumate.ai"
                  value={newProfileEmail}
                  onChange={(e) => setNewProfileEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">Target Role *</label>
                  <select
                    value={newProfileRole}
                    onChange={(e) => setNewProfileRole(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="Director">Director</option>
                    <option value="Manager">Manager</option>
                    <option value="Data Analyst">Data Analyst</option>
                    <option value="Research Assistant">Research Assistant</option>
                    <option value="Strategy Lead">Strategy Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#1E293B] mb-1">Department *</label>
                  <select
                    value={newProfileDept}
                    onChange={(e) => setNewProfileDept(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="Executive Board">Executive Board</option>
                    <option value="Operations & Delivery">Operations</option>
                    <option value="MIS & Analytics">MIS & Analytics</option>
                    <option value="Strategic Intelligence">Strategy</option>
                    <option value="Finance & Treasury">Finance</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-[#CBD5E1] text-[#64748B] hover:text-[#1E293B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-semibold shadow-sm transition-colors"
                >
                  Build & Activate Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
