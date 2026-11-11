import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Shield, ArrowRight, Lock, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { mockUsers } from '../mockData';

export default function Login() {
  const { setCurrentUser, setIsAuthenticated, showToast } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('sarah.jenkins@execumate.ai');
  const [password, setPassword] = useState('password123');

  const handleLogin = (e) => {
    e.preventDefault();
    const found = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || mockUsers[0];
    setCurrentUser(found);
    setIsAuthenticated(true);
    showToast(`Signed in as ${found.name} (${found.role})`);
    navigate('/');
  };

  const handleQuickLogin = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    showToast(`Quick signed in as ${user.name} (${user.role})`);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#2563EB] text-white shadow-md shadow-blue-500/20 mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#1E293B]">
          ExecuMate <span className="text-[#2563EB]">AI</span>
        </h2>
        <p className="mt-1 text-xs text-[#64748B]">
          Executive Business Reporting, Document Intelligence & MIS Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 border border-[#E2E8F0] shadow-sm rounded-2xl">
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#1E293B] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-[#64748B] cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-0" />
                <span>Remember session</span>
              </label>
              <span className="text-[#2563EB] hover:underline cursor-pointer">Forgot password?</span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors text-xs flex items-center justify-center gap-2"
            >
              <span>Sign in to Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins for Interview / Evaluation */}
          <div className="mt-6 pt-5 border-t border-[#F1F5F9]">
            <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2.5 text-center">
              1-Click Demo Persona Login
            </p>
            <div className="grid grid-cols-2 gap-2">
              {mockUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleQuickLogin(user)}
                  className="p-2 border border-[#E2E8F0] hover:border-blue-300 hover:bg-blue-50/50 rounded-lg text-left transition-colors text-xs"
                >
                  <div className="font-semibold text-[#1E293B] truncate">{user.role}</div>
                  <div className="text-[10px] text-[#64748B] truncate">{user.name.split(' ')[0]}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

