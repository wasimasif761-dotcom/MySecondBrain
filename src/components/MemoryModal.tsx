import React from 'react';
import { X, Trash2, Database, Calendar, Tag, FileText, Globe } from 'lucide-react';
import { MemoryItem } from '../types';

interface MemoryModalProps {
  memory: MemoryItem | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  memory,
  onClose,
  onDelete,
}) => {
  if (!memory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0a0e21] border border-purple-500/40 p-6 shadow-2xl shadow-purple-500/20 overflow-hidden space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-hud text-base font-bold text-slate-100 uppercase tracking-wider">
                Memory Vault Record
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">ID: {memory.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Badge & Timestamp */}
        <div className="flex items-center justify-between text-xs font-mono">
          <span
            className={`px-2 py-0.5 rounded uppercase font-bold text-[10px] ${
              memory.source === 'web-search'
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-700'
                : memory.source === 'pdf'
                ? 'bg-amber-950 text-amber-400 border border-amber-700'
                : 'bg-purple-950 text-purple-400 border border-purple-700'
            }`}
          >
            {memory.source}
          </span>
          <span className="flex items-center gap-1 text-slate-400 text-[11px]">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(memory.timestamp).toLocaleString()}
          </span>
        </div>

        {/* Content Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Memory Content:</label>
          <div className="max-h-48 overflow-y-auto p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
            {memory.text}
          </div>
        </div>

        {/* Vector Embedding Preview */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Vector Embedding ({memory.embedding?.length || 384} dims):</span>
            <span className="text-cyan-400">Float32 L2-Normalized</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-900 text-[10px] font-mono text-cyan-300 truncate">
            [{memory.embedding?.slice(0, 8).map((n) => n.toFixed(4)).join(', ')}, ...]
          </div>
        </div>

        {/* Metadata Details */}
        {memory.metadata && (
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] space-y-1">
            {memory.metadata.docTitle && (
              <div className="flex items-center gap-1.5 text-slate-300">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Document: {memory.metadata.docTitle}</span>
              </div>
            )}
            {memory.metadata.query && (
              <div className="flex items-center gap-1.5 text-slate-300">
                <Globe className="w-3.5 h-3.5 text-purple-400" />
                <span>Original Query: {memory.metadata.query}</span>
              </div>
            )}
            {memory.metadata.similarity !== undefined && (
              <div className="text-emerald-400 font-mono">
                Cosine Similarity Score: {(memory.metadata.similarity * 100).toFixed(1)}%
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              onDelete(memory.id);
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Memory</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
