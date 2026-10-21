import React from 'react';
import { Cpu, Wifi, WifiOff, Volume2, VolumeX, Download, Sparkles, Menu, HardDrive, Share2 } from 'lucide-react';
import { WebGPUDiagnostic } from '../types';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { downloadSingleFileHTML } from '../utils/exportSingleFile';

interface HeaderProps {
  webgpu: WebGPUDiagnostic | null;
  memoryCount: number;
  isModelReady: boolean;
  ttsEnabled: boolean;
  onToggleTTS: () => void;
  onOpenSidebar: () => void;
  onOpenModelModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  webgpu,
  memoryCount,
  isModelReady,
  ttsEnabled,
  onToggleTTS,
  onOpenSidebar,
  onOpenModelModal,
}) => {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();

  return (
    <header className="sticky top-0 z-30 border-b border-cyan-500/20 bg-[#070913]/90 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 focus:outline-none"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-purple-600 to-indigo-800 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#070913] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-hud font-bold text-lg sm:text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400">
                MySecondBrain
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/40 text-cyan-300">
                Offline PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate hidden xs:block">
              Architected by <span className="text-slate-200 font-medium">Waseem Asif</span>
            </p>
          </div>
        </div>

        {/* Right: Actions, Badges & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* WebGPU Status Pill */}
          <button
            onClick={onOpenModelModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition group hover:border-cyan-400"
            style={{
              borderColor: isModelReady ? 'rgba(34, 197, 94, 0.4)' : webgpu?.supported ? 'rgba(6, 182, 212, 0.4)' : 'rgba(239, 68, 68, 0.4)',
              backgroundColor: isModelReady ? 'rgba(34, 197, 94, 0.1)' : 'rgba(15, 23, 42, 0.6)',
              color: isModelReady ? '#4ade80' : webgpu?.supported ? '#38bdf8' : '#f87171',
            }}
            title="Click to view WebGPU diagnostics and Neural Engine status"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {isModelReady ? 'WebLLM Active' : webgpu?.supported ? 'WebGPU Ready' : 'WebGPU Limited'}
            </span>
            <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: isModelReady ? '#22c55e' : '#06b6d4' }} />
          </button>

          {/* Memory Count */}
          <div
            onClick={onOpenSidebar}
            className="cursor-pointer hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-purple-500/30 bg-purple-950/30 text-purple-300 text-xs font-mono hover:border-purple-400 transition"
            title="Total vectors stored in IndexedDB Memory Vault"
          >
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            <span>Vault: {memoryCount}</span>
          </div>

          {/* Network state */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-mono ${
              isOnline
                ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400'
                : 'border-amber-500/40 bg-amber-950/40 text-amber-300 animate-pulse'
            }`}
            title={isOnline ? 'Online: Live Wikipedia Search available' : 'Offline Mode: Zero external requests, using cached knowledge'}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* TTS Speech Read-Aloud Toggle */}
          <button
            onClick={onToggleTTS}
            className={`p-2 rounded-lg border text-xs transition ${
              ttsEnabled
                ? 'border-cyan-500/40 bg-cyan-950/30 text-cyan-300 shadow-sm shadow-cyan-500/20'
                : 'border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300'
            }`}
            title={ttsEnabled ? 'Voice Output: ON (SpeechSynthesis active)' : 'Voice Output: MUTED'}
            aria-label="Toggle text to speech"
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Single-file HTML Export */}
          <button
            onClick={downloadSingleFileHTML}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:border-cyan-500 text-slate-200 text-xs transition"
            title="Download complete self-contained HTML file (Single-file zero-build distribution)"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Single-File HTML</span>
          </button>

          {/* PWA Install Button */}
          {isInstallable && !isInstalled && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 hover:opacity-95 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install PWA</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
