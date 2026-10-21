import React, { useRef, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  User,
  Globe,
  Database,
  Search,
  CheckCircle2,
  Loader2,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { ChatMessage, LanguageId, PersonaId, MemoryItem } from '../types';

interface ChatAreaProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  activeSpeechMessageId: string | null;
  onPlaySpeech: (msg: ChatMessage) => void;
  onStopSpeech: () => void;
  language: LanguageId;
  persona: PersonaId;
  onSelectPrompt: (promptText: string) => void;
  onSelectMemoryForDetail: (mem: MemoryItem) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isGenerating,
  activeSpeechMessageId,
  onPlaySpeech,
  onStopSpeech,
  language,
  persona,
  onSelectPrompt,
  onSelectMemoryForDetail,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const isRTL = language === 'urdu' || language === 'arabic';
  const textFontClass =
    language === 'urdu'
      ? 'font-urdu leading-loose text-base'
      : language === 'arabic'
      ? 'font-arabic leading-relaxed text-base'
      : 'font-sans text-sm';

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-5 bg-cyber-grid">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center py-12 px-4 space-y-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center p-0.5 shadow-xl shadow-cyan-500/20">
              <div className="w-full h-full bg-[#070913] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
          </div>

          <div className="space-y-2">
            <h2 className="font-hud text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-purple-300">
              MySecondBrain Active
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Zero cloud telemetry. Local WebLLM reasoning, Vector RAG memory in IndexedDB, autonomous Wikipedia web searches, and speech interaction.
            </p>
          </div>

          {/* Quick starter prompts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left pt-2">
            {[
              {
                title: 'Remember My Goal',
                prompt: 'Please remember that my current project is building an offline PWA with WebGPU and IndexedDB.',
                tag: 'Memory Ingestion',
              },
              {
                title: 'Agentic Web Research',
                prompt: 'Search Wikipedia for latest facts on Quantum Computing and explain its core principles.',
                tag: 'Self-Updating Knowledge',
              },
              {
                title: 'Urdu Conversation (اردو)',
                prompt: 'کیا آپ مجھے سیکنڈ برین کے فوائد اردو میں سمجھا سکتے ہیں؟',
                tag: 'Multilingual RTL',
              },
              {
                title: 'Document Q&A',
                prompt: 'I uploaded my document. Can you summarize the main findings from the PDF in my memory vault?',
                tag: 'PDF Vector Search',
              },
            ].map((card, i) => (
              <button
                key={i}
                onClick={() => onSelectPrompt(card.prompt)}
                className="group p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 transition flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200 group-hover:text-cyan-300 transition">
                      {card.title}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                      {card.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{card.prompt}</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-cyan-400/80 font-mono group-hover:translate-x-0.5 transition">
                  <span>Activate</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isAssistant = msg.role === 'assistant';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* Assistant Avatar */}
                {isAssistant && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 shrink-0 shadow-md shadow-purple-500/20">
                    <div className="w-full h-full bg-[#0a0d1c] rounded-[10px] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    </div>
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`max-w-[85%] sm:max-w-[78%] flex flex-col space-y-2 ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* RAG Memory Citation Pill */}
                  {isAssistant && msg.ragMemories && msg.ragMemories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-[10px] text-purple-300 font-mono">
                        <Database className="w-3 h-3 text-purple-400" />
                        <span>RAG: {msg.ragMemories.length} Memories Recalled</span>
                      </div>
                      {msg.ragMemories.map((mem, idx) => (
                        <button
                          key={mem.id}
                          onClick={() => onSelectMemoryForDetail(mem)}
                          className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:border-cyan-400 text-[10px] truncate max-w-[180px] transition"
                          title={mem.text}
                        >
                          #{idx + 1} {mem.metadata?.docTitle || mem.source} ({Math.round((mem.metadata?.similarity || 0) * 100)}%)
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Agentic Search Status Card */}
                  {msg.isSearchingWeb && (
                    <div className="w-full p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center gap-3 text-cyan-300 text-xs animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <div>
                        <p className="font-semibold">Autonomous Web Agent Activated</p>
                        <p className="text-[11px] text-cyan-200/80">
                          Fetching Wikipedia for: &quot;{msg.searchQuery}&quot;...
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Completed Web Search Pill */}
                  {msg.searchQuery && !msg.isSearchingWeb && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-300 font-mono">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Synthesized from Wikipedia: &quot;{msg.searchQuery}&quot; (Cached Offline)</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-1" />
                    </div>
                  )}

                  {/* Bubble Content */}
                  <div
                    dir={isRTL ? 'rtl' : 'ltr'}
                    className={`rounded-2xl p-3.5 sm:p-4 leading-relaxed whitespace-pre-wrap break-words ${textFontClass} ${
                      isUser
                        ? 'bg-gradient-to-r from-cyan-900/60 to-blue-900/60 border border-cyan-500/40 text-cyan-50 rounded-tr-xs shadow-md shadow-cyan-950/40'
                        : 'bg-[#0e1329] border border-purple-500/30 text-slate-100 rounded-tl-xs shadow-md shadow-purple-950/20'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Meta Bar: Timestamp & Audio TTS Replay */}
                  <div className="flex items-center gap-2 px-1 text-[10px] text-slate-500 font-mono">
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {isAssistant && (
                      <button
                        onClick={() => {
                          if (activeSpeechMessageId === msg.id) {
                            onStopSpeech();
                          } else {
                            onPlaySpeech(msg);
                          }
                        }}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-cyan-400 transition ${
                          activeSpeechMessageId === msg.id ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-500'
                        }`}
                        title={activeSpeechMessageId === msg.id ? 'Stop speaking' : 'Read out loud via SpeechSynthesis'}
                      >
                        {activeSpeechMessageId === msg.id ? (
                          <>
                            <VolumeX className="w-3 h-3 text-cyan-400 animate-pulse" />
                            <span className="text-cyan-400 font-bold">Speaking...</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>Read</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5 shrink-0 shadow-md shadow-cyan-500/20">
                    <div className="w-full h-full bg-[#081024] rounded-[10px] flex items-center justify-center">
                      <User className="w-4 h-4 text-cyan-300" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isGenerating && (
            <div className="flex gap-3 items-center text-slate-400 text-xs font-mono">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 shrink-0">
                <div className="w-full h-full bg-[#0a0d1c] rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0e1329] border border-purple-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-slate-400 ml-1 text-xs">Reasoning with WebLLM...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};
