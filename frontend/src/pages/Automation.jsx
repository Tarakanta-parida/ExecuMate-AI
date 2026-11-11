import React, { useState } from 'react';
import {
  Zap,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  RefreshCw,
  Sliders,
  Calendar,
  Send,
  Webhook
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Automation() {
  const { workflows, executionLogs, triggerWorkflow, showToast } = useApp();
  const [runningId, setRunningId] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  const handleRunWorkflow = (wfId) => {
    setRunningId(wfId);
    setTimeout(() => {
      triggerWorkflow(wfId);
      setRunningId(null);
    }, 900);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1E293B] flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#2563EB]" />
            Workflow Automation Center
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Orchestrate automated MIS reporting, proactive deadline alerts, and n8n webhook pipelines
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => showToast("Connected to n8n webhook orchestrator (v1.64). All triggers live.", "info")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            n8n Engine Online
          </button>
        </div>
      </div>

      {/* Configured Workflows Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workflows.map((wf) => {
          const isExecuting = runningId === wf.id;

          return (
            <div
              key={wf.id}
              className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                      <Webhook className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#1E293B]">{wf.name}</h3>
                      <div className="flex items-center gap-2 text-[11px] text-[#64748B] mt-0.5">
                        <span className="font-medium text-[#2563EB]">{wf.trigger}</span>
                        <span>•</span>
                        <span>{wf.schedule}</span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>

                <p className="text-xs text-[#475569] mt-3 leading-relaxed">{wf.description}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                <div className="text-[11px] text-[#64748B]">
                  <span>Last run: <strong className="text-[#1E293B]">{wf.lastRun}</strong></span>
                  <span className="mx-2">•</span>
                  <span>{wf.executionCount} executions</span>
                </div>

                <button
                  onClick={() => handleRunWorkflow(wf.id)}
                  disabled={isExecuting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#2563EB] text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
                  <span>{isExecuting ? 'Executing...' : 'Run Now'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Execution History Logs */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
              Execution Logs & Audit Trail
            </h2>
            <p className="text-[11px] text-[#64748B]">Real-time execution telemetry recorded by PostgreSQL backend</p>
          </div>
          <span className="text-xs font-semibold text-[#64748B]">{executionLogs.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0] font-semibold">
              <tr>
                <th className="py-3 px-4">Workflow Name</th>
                <th className="py-3 px-4">Trigger Mechanism</th>
                <th className="py-3 px-4">Execution Time</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Execution Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {executionLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#1E293B]">{log.workflowName}</td>
                  <td className="py-3 px-4 text-[#475569]">{log.triggerType}</td>
                  <td className="py-3 px-4 text-[#64748B] font-mono text-[11px]">{log.executedAt}</td>
                  <td className="py-3 px-4 text-[#475569] font-mono text-[11px]">{log.durationMs} ms</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="w-3 h-3" /> Success
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#475569] text-[11px] max-w-xs truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

