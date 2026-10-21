import React, { useState, useRef } from 'react';
import {
  Brain,
  X,
  Search,
  Trash2,
  Download,
  Upload,
  PlusCircle,
  Globe,
  UserCheck,
  Cpu,
  FileText,
  Mail,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import { MemoryItem, PersonaId, LanguageId, MemorySource } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  persona: PersonaId;
  onChangePersona: (p: PersonaId) => void;
  language: LanguageId;
  onChangeLanguage: (l: LanguageId) => void;
  memories: MemoryItem[];
  onDeleteMemory: (id: string) => void;
  onClearAllMemories: () => void;
  onAddQuickFact: (factText: string) => void;
  onExportBrain: () => void;
  onImportBrain: (file: File) => void;
  onOpenModelModal: () => void;
  onSelectMemoryForDetail: (mem: MemoryItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  persona,
  onChangePersona,
  language,
  onChangeLanguage,
  memories,
  onDeleteMemory,
  onClearAllMemories,
  onAddQuickFact,
  onExportBrain,
  onImportBrain,
  onOpenModelModal,
  onSelectMemoryForDetail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [isAddingFact, setIsAddingFact] = useState(false);
  const [newFactText, setNewFactText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter memories
  const filteredMemories = memories.filter((m) => {
    const matchesQuery =
      m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.metadata?.query && m.metadata.query.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.metadata?.docTitle && m.metadata.docTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSource = sourceFilter === 'all' || m.source === sourceFilter;
    return matchesQuery && matchesSource;
  });

  const handleAddFactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactText.trim()) return;
    onAddQuickFact(newFactText.trim());
    setNewFactText('');
    setIsAddingFact(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportBrain(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-80 lg:w-96 bg-[#090d1c] border-r border-cyan-500/20 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-400" />
            <h2 className="font-hud font-bold text-sm tracking-wider uppercase text-cyan-300">
              Neural Control Hub
            </h2>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Configuration & Vault Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Persona Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                AI Persona
              </label>
              <span className="text-[10px] text-purple-400 font-mono">System Prompt</span>
            </div>
            <select
              value={persona}
              onChange={(e) => onChangePersona(e.target.value as PersonaId)}
              className="w-full bg-slate-950/90 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-400 transition"
            >
              <option value="strict-teacher">Strict Teacher (سخت استاد)</option>
              <option value="empathetic-friend">Empathetic Friend (نرم دوست)</option>
              <option value="professional-advisor">Professional Advisor (پروفیشنل ایڈوائزر)</option>
            </select>
          </div>

          {/* Multilingual Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                Active Language & Script
              </label>
              <span className="text-[10px] text-cyan-400 font-mono">RTL Supported</span>
            </div>
            <select
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value as LanguageId)}
              className="w-full bg-slate-950/90 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-400 transition"
            >
              <option value="urdu">Urdu (اردو) [RTL]</option>
              <option value="roman-urdu">Roman Urdu (Urdu in English alphabet)</option>
              <option value="english">English (Standard US/UK)</option>
              <option value="arabic">Arabic (العربية) [RTL]</option>
              <option value="hindi">Hindi (हिंदी)</option>
            </select>
          </div>

          {/* Neural Engine Diagnostic Card */}
          <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Local WebLLM Engine
              </span>
              <button
                onClick={onOpenModelModal}
                className="text-[10px] text-cyan-400 underline hover:text-cyan-200"
              >
                Inspect
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Default: <code className="text-cyan-300 text-[10px]">Llama-3-8B-Instruct-q4f32_1-MLC</code>. Runs entirely inside your browser via WebGPU & IndexedDB.
            </p>
          </div>

          {/* Memory Vault Header & Controls */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-purple-400" />
                  Memory Vault (RAG)
                </h3>
                <p className="text-[10px] text-slate-500">Vectorized IndexedDB storage</p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-900/40 border border-purple-500/40 text-purple-300">
                {memories.length} Facts
              </span>
            </div>

            {/* Quick Add Fact Form */}
            {isAddingFact ? (
              <form onSubmit={handleAddFactSubmit} className="space-y-2 bg-slate-950 p-3 rounded-xl border border-purple-500/40">
                <label className="text-[11px] text-purple-300 font-medium">Add Permanent Memory Fact:</label>
                <textarea
                  value={newFactText}
                  onChange={(e) => setNewFactText(e.target.value)}
                  placeholder="e.g. My favorite programming language is TypeScript, or I was born in Lahore..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-purple-400 resize-none"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingFact(false)}
                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium"
                  >
                    Save to Vault
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingFact(true)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-purple-500/30 bg-purple-950/20 text-purple-300 hover:bg-purple-900/30 text-xs transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Remember New Fact</span>
              </button>
            )}

            {/* Memory Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stored memories..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-cyan-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex gap-1 overflow-x-auto pb-1 text-[10px]">
              {(['all', 'conversation', 'web-search', 'pdf', 'manual'] as (MemorySource | 'all')[]).map((src) => (
                <button
                  key={src}
                  onClick={() => setSourceFilter(src)}
                  className={`px-2 py-0.5 rounded-full capitalize whitespace-nowrap transition ${
                    sourceFilter === src
                      ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                      : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {src === 'all' ? 'All' : src}
                </button>
              ))}
            </div>

            {/* Memories List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {filteredMemories.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                  No memories found. Chat with the AI, search Wikipedia, or upload a PDF to auto-ingest facts.
                </div>
              ) : (
                filteredMemories.map((mem) => (
                  <div
                    key={mem.id}
                    onClick={() => onSelectMemoryForDetail(mem)}
                    className="group relative p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono ${
                          mem.source === 'web-search'
                            ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                            : mem.source === 'pdf'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : mem.source === 'manual'
                            ? 'bg-purple-950 text-purple-400 border border-purple-800'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {mem.source}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(mem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-sans">
                      {mem.text}
                    </p>
                    {mem.metadata?.docTitle && (
                      <p className="text-[10px] text-cyan-400/80 mt-1 truncate">
                        📄 {mem.metadata.docTitle}
                      </p>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMemory(mem.id);
                      }}
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition"
                      title="Delete this memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Backup & Restore Vault Actions */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Data Backup & Restore
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onExportBrain}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-cyan-300 text-xs font-medium hover:bg-cyan-900/30 transition"
                title="Download all IndexedDB memories as a JSON file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Brain</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-purple-500/30 bg-purple-950/20 text-purple-300 text-xs font-medium hover:bg-purple-900/30 transition"
                title="Restore memories from a JSON backup file"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Brain</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {memories.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to erase all stored memories in IndexedDB?')) {
                    onClearAllMemories();
                  }
                }}
                className="w-full py-1 text-[11px] text-red-400/80 hover:text-red-300 transition text-center"
              >
                Wipe Memory Vault
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Footer: Author & Feedback */}
        <div className="p-3 border-t border-cyan-500/20 bg-[#060812] text-[11px] text-slate-400 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300 font-hud">Author: Waseem Asif</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
              Offline First
            </span>
          </div>
          <a
            href="mailto:wasimasif761@gmail.com"
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition text-[11px] truncate"
          >
            <Mail className="w-3 h-3 shrink-0" />
            <span>wasimasif761@gmail.com</span>
          </a>
        </div>
      </aside>
    </>
  );
};
