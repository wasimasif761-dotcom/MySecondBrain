import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  FileUp,
  Globe,
  Loader2,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { LanguageId, PDFIngestionProgress } from '../types';
import { startVoiceRecognition, isSpeechRecognitionSupported } from '../services/speech';

interface InputDockProps {
  onSendMessage: (text: string, forceWebSearch?: boolean) => void;
  onUploadPDF: (file: File) => void;
  isGenerating: boolean;
  isUploadingPDF: boolean;
  pdfProgress: PDFIngestionProgress | null;
  language: LanguageId;
}

export const InputDock: React.FC<InputDockProps> = ({
  onSendMessage,
  onUploadPDF,
  isGenerating,
  isUploadingPDF,
  pdfProgress,
  language,
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isWebSearchActive, setIsWebSearchActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<{ stop: () => void; abort: () => void } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isRTL = language === 'urdu' || language === 'arabic';

  const placeholders: Record<LanguageId, string> = {
    urdu: 'یہاں اپنا سوال پوچھیں یا نئی بات یاد کرائیں...',
    'roman-urdu': 'Yahan sawal poochein ya koi nayi baat yaad karayein...',
    english: 'Ask anything, recall memories, or research web topics...',
    arabic: 'اطرح سؤالك هنا أو اطلب حفظ معلومة جديدة...',
    hindi: 'यहाँ अपना प्रश्न पूछें या कोई नई बात याद कराएँ...',
  };

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    onSendMessage(input.trim(), isWebSearchActive);
    setInput('');
    setIsWebSearchActive(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice Recognition Toggle
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      alert('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    setIsListening(true);
    recognitionRef.current = startVoiceRecognition({
      language,
      onResult: (transcript, isFinal) => {
        setInput(transcript);
        if (isFinal) {
          setIsListening(false);
        }
      },
      onError: (err) => {
        console.warn('[Speech STT Error]', err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });
  };

  // PDF File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadPDF(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-t border-cyan-500/20 bg-[#070913]/95 backdrop-blur-md p-3 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* PDF Ingestion Progress Banner */}
        {isUploadingPDF && pdfProgress && (
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs text-purple-200 flex flex-col gap-1.5 animate-pulse">
            <div className="flex items-center justify-between font-mono">
              <span className="flex items-center gap-1.5 font-semibold">
                <FileCheck className="w-4 h-4 text-purple-400" />
                Ingesting PDF: {pdfProgress.stage.toUpperCase()}...
              </span>
              <span>{pdfProgress.progressPct}%</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full transition-all duration-300"
                style={{ width: `${pdfProgress.progressPct}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Extracting text chunks, generating vector embeddings, and indexing into IndexedDB Memory Vault...
            </p>
          </div>
        )}

        {/* Voice Listening Active Indicator */}
        {isListening && (
          <div className="flex items-center justify-center gap-2 py-1.5 text-xs text-cyan-300 font-mono bg-cyan-950/40 border border-cyan-500/40 rounded-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Listening to voice speech ({language})... Speak clearly</span>
          </div>
        )}

        {/* Input Dock Container */}
        <div className="relative flex items-end gap-2 bg-[#090d1e] border border-cyan-500/30 focus-within:border-cyan-400 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.15)] rounded-2xl p-2 transition">
          {/* Left Actions: PDF Upload & Web Search toggle */}
          <div className="flex items-center gap-1 pb-1">
            {/* PDF Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPDF || isGenerating}
              className={`p-2 rounded-xl transition ${
                isUploadingPDF
                  ? 'bg-purple-900/40 text-purple-400'
                  : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800'
              }`}
              title="Upload PDF Document (Vector RAG ingestion into Memory Vault)"
              aria-label="Upload PDF Document"
            >
              {isUploadingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              ) : (
                <FileUp className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Web Search Agent Toggle */}
            <button
              onClick={() => setIsWebSearchActive(!isWebSearchActive)}
              className={`p-2 rounded-xl text-xs transition flex items-center gap-1 ${
                isWebSearchActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm shadow-cyan-500/20'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
              title="Toggle Live Web Search Mode (Autonomous Wikipedia discovery)"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline text-[10px] font-mono font-semibold">Web</span>
            </button>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            dir={isRTL ? 'rtl' : 'ltr'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholders[language]}
            rows={1}
            disabled={isGenerating}
            className="flex-1 max-h-32 bg-transparent text-slate-100 placeholder:text-slate-500 text-sm outline-none resize-none py-2 px-1 font-sans"
          />

          {/* Right Actions: Mic & Send */}
          <div className="flex items-center gap-1.5 pb-1">
            {/* Mic Button */}
            <button
              onClick={toggleListening}
              className={`p-2 rounded-xl transition ${
                isListening
                  ? 'bg-red-500/20 text-red-400 border border-red-500 animate-pulse'
                  : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800'
              }`}
              title={isListening ? 'Click to stop listening' : 'Voice Input (Speech-to-Text)'}
              aria-label="Toggle voice input"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className={`p-2.5 rounded-xl font-bold transition flex items-center justify-center ${
                input.trim() && !isGenerating
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30 hover:opacity-95'
                  : 'bg-slate-800/80 text-slate-600 cursor-not-allowed'
              }`}
              title="Send message (Enter)"
              aria-label="Send message"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Bottom subtle capability tags */}
        <div className="flex items-center justify-between px-1 text-[10px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-500" />
            Top 3 RAG Memories Auto-Injected
          </span>
          <span>Shift+Enter for newline</span>
        </div>
      </div>
    </div>
  );
};
