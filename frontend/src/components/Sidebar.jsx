import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSearch,
  BarChart3,
  CheckSquare,
  Zap,
  FileText,
  Settings,
  Layers,
  ShieldAlert,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { mockUsers } from '../mockData';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'AI Research', path: '/research', icon: FileSearch, badge: 'RAG' },
  { name: 'Data Analytics', path: '/analytics', icon: BarChart3, badge: 'MIS' },
  { name: 'Projects & Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Automation', path: '/automation', icon: Zap },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  const { currentUser, setCurrentUser, tasks, users } = useApp();
  const overdueCount = tasks.filter(t => t.isOverdue && t.status !== 'completed').length;

  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-[#E2E8F0] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-[#1E293B]">ExecuMate</span>
            <span className="text-[#2563EB] font-semibold text-xs ml-1.5 px-1.5 py-0.5 bg-blue-50 rounded">AI</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-[#64748B] uppercase">
          Core Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-[#2563EB] font-semibold'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </div>
              {item.path === '/tasks' && overdueCount > 0 ? (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                  {overdueCount} due
                </span>
              ) : item.badge ? (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </div>

      {/* Role Switcher (For Interviews & Demonstrations) */}
      <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-[#2563EB]" /> Persona Mode
          </span>
          <span className="text-[10px] text-blue-600 font-medium">Demo Tool</span>
        </div>
        <select
          value={currentUser.id}
          onChange={(e) => {
            const found = (users || mockUsers).find(u => u.id === e.target.value);
            if (found) setCurrentUser(found);
          }}
          className="w-full text-xs bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-2 text-[#1E293B] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] cursor-pointer"
        >
          {(users || mockUsers).map(user => (
            <option key={user.id} value={user.id}>
              {user.role} — {user.name.split(' ')[0]}
            </option>
          ))}
        </select>
        <div className="mt-2 text-[11px] text-[#64748B] leading-tight">
          Current: <strong className="text-[#1E293B]">{currentUser.role}</strong> ({currentUser.department})
        </div>
      </div>
    </aside>
  );
}

