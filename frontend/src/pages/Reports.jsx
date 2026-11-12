import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  PlusCircle,
  Eye,
  Calendar,
  Share2,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Reports() {
  const { reports, generateReportFromData, deleteReport, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFormat, setFilterFormat] = useState('All');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const filteredReports = reports.filter((r) => {
    const matchSearch =
      searchTerm === '' ||
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFormat = filterFormat === 'All' || r.format === filterFormat;
    return matchSearch && matchFormat;
  });

  const handleDelete = (report) => {
    deleteReport(report.id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1E293B] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#2563EB]" />
            Reports & Executive Insights
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Access, export, manage, and download authorized MIS spreadsheets and AI-synthesized briefings
          </p>
        </div>

        <button
          onClick={() => generateReportFromData(`Executive_Consolidated_MIS_${new Date().toISOString().slice(0, 10)}.xlsx`)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Generate New MIS Report</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reports by title or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#1E293B] focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={filterFormat}
            onChange={(e) => setFilterFormat(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-[#1E293B] focus:outline-none"
          >
            <option value="All">All Formats (Excel & PDF)</option>
            <option value="Excel">Excel (.xlsx)</option>
            <option value="PDF">PDF (.pdf)</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-[#64748B] flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[#1E293B]">No reports found</h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            All files matching your filter have been deleted or none match your search. Click "Generate New MIS Report" to generate fresh reports.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReports.map((report) => {
            const isConfirming = deleteConfirmId === report.id;

            return (
              <div
                key={report.id}
                className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm hover:shadow transition-all flex flex-col justify-between min-w-0"
              >
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          report.format === 'Excel'
                            ? 'bg-emerald-50 text-[#16A34A]'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {report.format === 'Excel' ? (
                          <FileSpreadsheet className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] truncate">
                          {report.category}
                        </span>
                        <h3 className="text-xs font-bold text-[#1E293B] truncate" title={report.name}>
                          {report.name}
                        </h3>
                      </div>
                    </div>

                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-[#F1F5F9] text-[#475569]">
                      {report.format}
                    </span>
                  </div>

                  {/* KPIs Included Tags */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {report.kpisIncluded?.map((kpi, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[10px] bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] px-2 py-0.5 rounded"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#2563EB]" /> {kpi}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#64748B]">
                    {report.size} • {report.generatedAt?.split(' ')[0]}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isConfirming ? (
                      <div className="inline-flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200 animate-in fade-in duration-150">
                        <span className="text-[10px] text-red-700 font-bold px-1">Delete?</span>
                        <button
                          onClick={() => handleDelete(report)}
                          className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-0.5 text-slate-600 hover:text-slate-900 text-[11px] transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(report.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 font-medium text-xs transition-colors"
                        title="Delete file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    )}

                    <button
                      onClick={() => showToast(`Downloading ${report.name} to local machine...`)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#2563EB] font-semibold text-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
