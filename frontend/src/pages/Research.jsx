import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Send,
  MessageSquare,
  FileSearch,
  BookOpen,
  CheckCircle2,
  FileCheck,
  Search,
  ExternalLink,
  ChevronRight,
  Bookmark,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Research() {
  const {
    documents,
    deleteDocument,
    selectedDocId,
    setSelectedDocId,
    selectedDocument,
    activeMessages,
    askDocumentQuestion,
    uploadDocument,
    showToast
  } = useApp();

  const [questionInput, setQuestionInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (!questionInput.trim()) return;
    askDocumentQuestion(questionInput);
    setQuestionInput('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      showToast('Please upload a PDF document.', 'warning');
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      uploadDocument(file);
      setIsUploading(false);
    }, 1200);
  };

  const samplePrompts = [
    "What are the main operational risks highlighted?",
    "Summarize the key financial metrics and EBITDA margin.",
    "What specific recommendations are made for leadership?"
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-8.5rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1E293B] flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#2563EB]" />
            AI Research Assistant & Document Intelligence
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Extract insights, grounded answers, and verifiable source citations from executive PDFs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-colors">
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Extracting Text...' : 'Upload PDF'}</span>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              disabled={isUploading}
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {/* 3-Column Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        {/* Left Column: Document Library (3 cols) */}
        <div className="lg:col-span-3 bg-white border border-[#E2E8F0] rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
            <span className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">Indexed Documents</span>
            <span className="text-[10px] font-semibold bg-blue-100 text-[#2563EB] px-2 py-0.5 rounded-full">
              {documents.length} Files
            </span>
          </div>

          <div className="p-2 overflow-y-auto flex-1 divide-y divide-[#F1F5F9] space-y-1">
            {documents.map((doc) => {
              const isSelected = doc.id === selectedDocId;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/80 border border-blue-200 shadow-xs'
                      : 'hover:bg-[#F8FAFC] border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-red-50 text-red-600'}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-[#1E293B] truncate" title={doc.title}>
                          {doc.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-[#64748B]">
                          <span>{doc.pages} pages</span>
                          <span>•</span>
                          <span>{doc.size}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#16A34A] font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Indexed in pgvector
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete "${doc.title}"?`)) {
                          deleteDocument(doc.id);
                        }
                      }}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete PDF"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upload Hint Box */}
          <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] text-[11px] text-[#64748B]">
            <p className="flex items-center gap-1.5 font-medium text-[#1E293B] mb-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Grounded & Private
            </p>
            AI responses cite exact page chunks without hallucinating missing data.
          </div>
        </div>

        {/* Center Column: Interactive AI Chat (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl flex flex-col overflow-hidden shadow-sm">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2 truncate">
              <MessageSquare className="w-4 h-4 text-[#2563EB]" />
              <span className="text-xs font-bold text-[#1E293B] truncate">
                Chat with: {selectedDocument.title}
              </span>
            </div>
            <span className="text-[10px] text-[#64748B] shrink-0">PyMuPDF + RAG Grounded</span>
          </div>

          {/* Chat Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {activeMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#64748B]">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center mb-3">
                  <FileSearch className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-[#1E293B]">Ask questions about this PDF</h3>
                <p className="text-xs max-w-sm mt-1">
                  ExecuMate extracts text chunks and references exact pages to answer questions accurately.
                </p>
              </div>
            ) : (
              activeMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs md:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#2563EB] text-white rounded-br-none shadow-xs'
                        : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B] rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Citations / Sources */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] space-y-1.5">
                        <span className="text-[11px] font-bold text-[#64748B] flex items-center gap-1 uppercase tracking-wider">
                          <Bookmark className="w-3 h-3 text-[#2563EB]" /> Verifiable Citations
                        </span>
                        {msg.citations.map((cite, cIdx) => (
                          <div
                            key={cIdx}
                            className="bg-white border border-[#E2E8F0] rounded-md px-2.5 py-1 text-[11px] text-[#1E293B] flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <span className="truncate">{cite.text}</span>
                            <span className="font-bold text-[#2563EB] shrink-0">p. {cite.page}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-[#94A3B8] mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))
            )}
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-3 py-2 border-t border-[#F1F5F9] bg-[#F8FAFC] flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-semibold text-[#64748B] shrink-0">Prompts:</span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => askDocumentQuestion(p)}
                className="text-[11px] bg-white border border-[#E2E8F0] text-[#475569] hover:border-blue-300 hover:text-[#2563EB] rounded-full px-2.5 py-1 whitespace-nowrap transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-[#E2E8F0] bg-white flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask anything about this document..."
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              className="flex-1 text-xs md:text-sm px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!questionInput.trim()}
              className="px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span>Ask AI</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Right Column: Document Insights & Executive Summary (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
            <span className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">Executive Insights</span>
            <span className="text-[10px] text-[#64748B]">Auto-generated</span>
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {/* Document metadata card */}
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1.5">
              <div className="font-bold text-[#1E293B]">{selectedDocument.title}</div>
              <div className="text-[11px] text-[#64748B]">
                Uploaded by <strong className="text-[#1E293B]">{selectedDocument.uploadedBy}</strong> on {selectedDocument.uploadedAt}
              </div>
            </div>

            {/* Executive Summary */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#2563EB]" /> Executive Summary
              </h3>
              <p className="text-xs text-[#334155] leading-relaxed bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                {selectedDocument.summary}
              </p>
            </div>

            {/* Key Takeaways */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">Key Findings</h3>
              <ul className="space-y-2">
                {selectedDocument.keyPoints?.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-[#334155]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0 mt-1.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">Actionable Recommendations</h3>
              <div className="space-y-1.5">
                {selectedDocument.recommendations?.map((rec, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/40 text-xs text-amber-900 flex items-start gap-2">
                    <span className="font-bold text-amber-700">#{idx + 1}</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

