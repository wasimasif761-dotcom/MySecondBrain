import React, { useState } from 'react';
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
  Zap,
  HelpCircle,
  Copy,
  Check,
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
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [copiedFlag, setCopiedFlag] = useState(false);

  if (!isOpen) return null;

  const isDownloading =
    downloadProgress.status === 'downloading' ||
    downloadProgress.status === 'compiling' ||
    downloadProgress.status === 'checking';

  const hasError = downloadProgress.status === 'error';

  const copyChromeFlag = () => {
    navigator.clipboard.writeText('chrome://flags/#enable-unsafe-webgpu');
    setCopiedFlag(true);
    setTimeout(() => setCopiedFlag(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl my-auto rounded-2xl bg-[#090d1f] border border-cyan-500/40 p-5 sm:p-6 shadow-2xl shadow-cyan-500/20 overflow-hidden space-y-4">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#090d1f] rounded-[10px] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h3 className="font-hud text-base sm:text-lg font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">
                Neural Engine Configuration
              </h3>
              <p className="text-xs text-slate-400">Offline-First AI Assistant for Mobile & Desktop</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WebGPU Diagnostic Warning / Success Card */}
        <div
          className={`p-3.5 rounded-xl border text-xs space-y-2 ${
            webgpu?.supported
              ? 'bg-cyan-950/20 border-cyan-500/40 text-cyan-200'
              : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
          }`}
        >
          <div className="flex items-center justify-between font-mono">
            <span className="flex items-center gap-1.5 font-bold">
              {webgpu?.supported ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  WebGPU Hardware: ACTIVE
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  WebGPU Hardware: RESTRICTED
                </>
              )}
            </span>
            <span
              className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-mono ${
                webgpu?.supported ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {webgpu?.supported ? 'Hardware Ready' : 'Mobile / Flag Restricted'}
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
            <div className="space-y-1.5 pt-0.5">
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                Mobile Chrome has WebGPU disabled by default. <strong>Don&apos;t worry!</strong> You can start chatting right now using the <strong>Instant Offline Engine</strong>, or enable WebGPU via Chrome flags.
              </p>
              <button
                type="button"
                onClick={() => setShowAndroidGuide(!showAndroidGuide)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-semibold flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showAndroidGuide ? 'Hide Instructions' : 'How to enable WebGPU on Android Chrome'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Android Chrome WebGPU Guide Accordion */}
        {showAndroidGuide && (
          <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/40 text-xs text-slate-300 space-y-2">
            <p className="font-semibold text-cyan-300">Enable WebGPU on Android Chrome (2 minutes):</p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
              <li>Open a new Chrome tab and go to:</li>
              <div className="flex items-center gap-2 p-1.5 bg-slate-900 rounded border border-slate-700 font-mono text-[10px] text-cyan-300">
                <span className="truncate flex-1">chrome://flags/#enable-unsafe-webgpu</span>
                <button
                  onClick={copyChromeFlag}
                  className="px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-200 hover:bg-cyan-800 flex items-center gap-1 shrink-0"
                >
                  {copiedFlag ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedFlag ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <li>Set <strong>Unsafe WebGPU</strong> to <strong>Enabled</strong>.</li>
              <li>Tap the blue <strong>Relaunch</strong> button at the bottom of Chrome.</li>
              <li>Re-open this page and tap <strong>Download & Load Model</strong>!</li>
            </ol>
          </div>
        )}

        {/* Model Selection Selector (Visible when WebGPU is ready or user wants to inspect) */}
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

        {/* Error notification card if download failed */}
        {hasError && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Download Failed on Current Device
            </p>
            <p className="text-[11px] text-red-300/80">
              {downloadProgress.error || 'WebGPU is not enabled or insufficient VRAM. You can use the Instant Offline Engine below.'}
            </p>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
          {/* If WebGPU is RESTRICTED: Make the Instant Offline Engine the primary big button! */}
          {!webgpu?.supported ? (
            <div className="w-full flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={onUseFallbackMode}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-95 transition flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-yellow-300" />
                <span>Start with Instant Offline Engine</span>
              </button>
              <button
                type="button"
                onClick={onStartDownload}
                className="py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-900 hover:border-slate-500 text-slate-300 text-xs transition"
                title="Attempt WebGPU download anyway"
              >
                Retry WebGPU
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={onUseFallbackMode}
                className="text-xs text-slate-400 hover:text-cyan-400 underline transition text-center sm:text-left"
              >
                Start with Lightweight Instant Engine
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {isModelReady ? (
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition flex items-center justify-center gap-1.5"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
