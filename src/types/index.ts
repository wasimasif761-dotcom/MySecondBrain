export type PersonaId = 'strict-teacher' | 'empathetic-friend' | 'professional-advisor';

export interface Persona {
  id: PersonaId;
  name: string;
  nativeName: string;
  description: string;
  systemPrompt: string;
  avatarColor: string;
}

export type LanguageId = 'urdu' | 'roman-urdu' | 'english' | 'arabic' | 'hindi';

export interface Language {
  id: LanguageId;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  speechCode: string;
  fontClass: string;
}

export type MemorySource = 'conversation' | 'web-search' | 'pdf' | 'manual';

export interface MemoryItem {
  id: string;
  text: string;
  embedding: number[];
  source: MemorySource;
  timestamp: number;
  metadata?: {
    query?: string;
    docTitle?: string;
    page?: number;
    tags?: string[];
    language?: LanguageId;
    similarity?: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  ragMemories?: MemoryItem[];
  isSearchingWeb?: boolean;
  searchQuery?: string;
  searchResults?: string[];
  isAudioPlaying?: boolean;
}

export interface WebGPUDiagnostic {
  supported: boolean;
  adapterName?: string;
  vendor?: string;
  architecture?: string;
  maxBufferSizeMB?: number;
  error?: string;
}

export interface ModelDownloadProgress {
  status: 'idle' | 'checking' | 'downloading' | 'compiling' | 'ready' | 'error' | 'fallback';
  progress: number; // 0 to 100
  text: string;
  bytesLoaded?: number;
  bytesTotal?: number;
  error?: string;
}

export interface PDFIngestionProgress {
  stage: 'reading' | 'extracting' | 'embedding' | 'saving' | 'done';
  currentPage?: number;
  totalPages?: number;
  currentChunk?: number;
  totalChunks?: number;
  progressPct: number;
}
