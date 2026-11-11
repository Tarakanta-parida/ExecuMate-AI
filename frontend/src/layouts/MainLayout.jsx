import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function MainLayout() {
  const { toastMessage } = useApp();

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Fixed Left Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white border border-[#E2E8F0] shadow-xl rounded-xl px-4 py-3 max-w-md animate-in slide-in-from-bottom-5 duration-200">
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />}
          {toastMessage.type === 'warning' && <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" />}
          {toastMessage.type === 'info' && <Info className="w-5 h-5 text-[#2563EB] shrink-0" />}
          <div className="text-xs md:text-sm font-medium text-[#1E293B]">
            {toastMessage.message}
          </div>
        </div>
      )}
    </div>
  );
}

