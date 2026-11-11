import React, { useState } from 'react';
import { Search, Bell, CheckCircle2, AlertTriangle, Info, LogOut, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { currentUser, notifications, showToast } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    showToast(`Searching across reports and documents for "${searchQuery}"...`, 'info');
  };

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input */}
      <div className="flex-1 max-w-md">
        <form onSubmit={handleSearch} className="relative">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects, documents, tasks, or metrics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#64748B] focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] transition-colors"
          />
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4 ml-4">
        {/* Date Display */}
        <div className="hidden md:flex flex-col text-right">
          <span className="text-xs font-semibold text-[#1E293B]">{todayFormatted}</span>
          <span className="text-[10px] text-[#64748B]">FY26 Q4 Reporting Period</span>
        </div>

        <div className="h-6 w-px bg-[#E2E8F0] hidden md:block" />

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 rounded-lg text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B] relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-2 border-b border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E293B]">Executive Alerts</span>
                <span className="text-[10px] font-medium text-[#2563EB] cursor-pointer hover:underline" onClick={() => setShowNotifs(false)}>
                  Dismiss
                </span>
              </div>
              <div className="divide-y divide-[#E2E8F0] max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 hover:bg-[#F8FAFC] transition-colors cursor-pointer text-xs">
                    <div className="flex items-start gap-2">
                      {n.type === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                      ) : n.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium text-[#1E293B] leading-snug">{n.title}</p>
                        <span className="text-[10px] text-[#64748B]">{n.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-3 pl-2">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-xs text-[#2563EB]">
            {currentUser.initials}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-[#1E293B] leading-none">{currentUser.name}</div>
            <div className="text-[11px] text-[#64748B] mt-1">{currentUser.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

