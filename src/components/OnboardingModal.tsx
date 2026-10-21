import React from 'react';
import {
  Cpu,
  DownloadCloud,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { WebGPUDiagnostic, ModelDownloadProgress } from '../types';
import { SUPPORTED_MODELS } from '../services/webllm';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  webgpu: WebGPUDiagnostic | null;
  downloadProgress: ModelDownloadProgress;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onStartDownload: () => void;
  onUseFallbackMode: () => void;
  isModelReady: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  webgpu,
  downloadProgress,
  selectedModel,
  onSelectModel,
  onStartDownload,
  onUseFallbackMode,
  isModelReady,
}) => {
  if (!isOpen) return null;

  const isDownloading =
    downloadProgress.status === 'downloading' || downloadProgress.status === 'compiling' || downloadProgress.status === 'checking';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#090d1f] border border-cyan-500/40 p-6 shadow-2xl shadow-cyan-500/20 overflow-hidden space-y-5">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#090d1f] rounded-[10px] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h3 className="font-hud text-lg font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">
                Neural Engine Configuration
              </h3>
              <p className="text-xs text-slate-400">WebLLM Client-Side Inference & WebGPU</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WebGPU Hardware Diagnostic Box */}
        <div
          className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
            webgpu?.supported
              ? 'bg-cyan-950/20 border-cyan-500/40 text-cyan-200'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
          }`}
        >
          <div className="flex items-center justify-between font-mono">
            <span className="flex items-center gap-1.5 font-bold">
              {webgpu?.supported ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  WebGPU Hardware Acceleration: ACTIVE
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  WebGPU Hardware Acceleration: RESTRICTED
                </>
              )}
            </span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-900 font-mono">
              {webgpu?.supported ? 'Device Verified' : 'Diagnostic Warning'}
            </span>
          </div>

          {webgpu?.supported ? (
            <div className="text-[11px] text-slate-300 grid grid-cols-2 gap-2 pt-1 font-mono">
              <div>
                <span className="text-slate-500">Device:</span> {webgpu.adapterName || 'GPU Adapter'}
              </div>
              <div>
                <span className="text-slate-500">Max Buffer:</span> {webgpu.maxBufferSizeMB || 256} MB
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-amber-300/90 leading-relaxed pt-1">
              {webgpu?.error ||
                'WebGPU is disabled or restricted in this browser session. You can still use the Full Vector RAG Vault, Wikipedia Agent Search, and PDF ingestion, or click "Export Single-File HTML" to run natively on your machine!'}
            </p>
          )}
        </div>

        {/* Model Selection Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            Select Local Model Architecture
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUPPORTED_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => onSelectModel(model.id)}
                disabled={isDownloading}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  selectedModel === model.id
                    ? 'bg-purple-950/40 border-purple-500 text-white shadow-md shadow-purple-500/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200">{model.name.split(' (')[0]}</span>
                    {model.recommended && (
                      <span className="text-[9px] px-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                        User Spec
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{model.vram} • {model.size}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Download & Initialization Progress Bar */}
        {(isDownloading || downloadProgress.progress > 0) && (
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-300 flex items-center gap-1.5 font-bold">
                <DownloadCloud className="w-4 h-4 text-cyan-400 animate-bounce" />
                {downloadProgress.status.toUpperCase()}: {downloadProgress.progress}%
              </span>
              <span className="text-slate-400">
                {downloadProgress.bytesLoaded && downloadProgress.bytesTotal
                  ? `${(downloadProgress.bytesLoaded / (1024 * 1024)).toFixed(1)} MB / ${(downloadProgress.bytesTotal / (1024 * 1024)).toFixed(1)} MB`
                  : 'Weights caching...'}
              </span>
            </div>

            {/* Glowing Bar */}
            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
              <div
                className="bg-gradient-to-r from-cyan-500 via-sky-400 to-purple-600 h-full rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                style={{ width: `${downloadProgress.progress}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400 font-mono truncate">{downloadProgress.text}</p>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onUseFallbackMode}
            className="text-xs text-slate-400 hover:text-cyan-400 underline transition"
          >
            Start with Lightweight Instant Engine
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isModelReady ? (
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ready - Enter SecondBrain</span>
              </button>
            ) : (
              <button
                onClick={onStartDownload}
                disabled={isDownloading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold text-xs shadow-lg shadow-cyan-500/30 hover:opacity-95 transition flex items-center justify-center gap-2"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>{isDownloading ? 'Downloading Model...' : 'Download & Load Model'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
