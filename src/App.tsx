/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  PersonaId,
  LanguageId,
  MemoryItem,
  ChatMessage,
  WebGPUDiagnostic,
  ModelDownloadProgress,
  PDFIngestionProgress,
} from './types';
import {
  getAllMemories,
  saveMemory,
  deleteMemory,
  clearAllMemories,
  saveChatMessage,
  getChatHistory,
  clearChatHistory,
  exportBrainData,
  importBrainData,
} from './services/db';
import { getEmbedding, searchTopMemories } from './services/embeddings';
import {
  checkWebGPUSupport,
  initWebLLMEngine,
  generateAIResponse,
  buildSystemPrompt,
  generateLocalFallbackResponse,
  isEngineLoaded,
} from './services/webllm';
import {
  detectSearchIntent,
  searchWikipedia,
  saveAcquiredWebKnowledge,
} from './services/agentSearch';
import { seedInitialKnowledgeIfEmpty } from './services/seedKnowledge';
import { ingestPDF } from './services/pdfIngestion';
import { speakText, stopSpeaking, isSpeaking } from './services/speech';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { InputDock } from './components/InputDock';
import { OnboardingModal } from './components/OnboardingModal';
import { MemoryModal } from './components/MemoryModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // App Configurations & Preferences
  const [persona, setPersona] = useState<PersonaId>('professional-advisor');
  const [language, setLanguage] = useState<LanguageId>('english');
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);

  // Data Stores
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // WebGPU & AI Engine Status
  const [webgpu, setWebgpu] = useState<WebGPUDiagnostic | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('Llama-3-8B-Instruct-q4f32_1-MLC');
  const [downloadProgress, setDownloadProgress] = useState<ModelDownloadProgress>({
    status: 'idle',
    progress: 0,
    text: 'Engine idle',
  });
  const [isModelReady, setIsModelReady] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // PDF Ingestion Status
  const [isUploadingPDF, setIsUploadingPDF] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<PDFIngestionProgress | null>(null);

  // Speech State
  const [activeSpeechMessageId, setActiveSpeechMessageId] = useState<string | null>(null);

  // Modals & Panels
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState<boolean>(false);
  const [inspectingMemory, setInspectingMemory] = useState<MemoryItem | null>(null);

  // Initialization & Service Worker
  useEffect(() => {
    // Register Service Worker for offline PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('./sw.js')
        .then((reg) => console.log('[PWA] Service Worker registered:', reg.scope))
        .catch((err) => console.warn('[PWA] Service Worker registration note:', err));
    }

    // Load IndexedDB Memories and Chats
    const loadData = async () => {
      try {
        await seedInitialKnowledgeIfEmpty();
        const storedMemories = await getAllMemories();
        setMemories(storedMemories);

        const storedChats = await getChatHistory();
        setMessages(storedChats);
      } catch (err) {
        console.error('[DB] Failed to load data:', err);
      }
    };
    loadData();

    // Check WebGPU hardware
    const checkGPU = async () => {
      const diag = await checkWebGPUSupport();
      setWebgpu(diag);

      // If WebGPU is supported, prompt onboarding modal
      if (diag.supported && !isEngineLoaded()) {
        setIsOnboardingModalOpen(true);
      }
    };
    checkGPU();

    return () => {
      stopSpeaking();
    };
  }, []);

  // Update HTML document direction and title if Urdu or Arabic is active
  useEffect(() => {
    document.documentElement.dir = language === 'urdu' || language === 'arabic' ? 'rtl' : 'ltr';
    document.documentElement.lang = language === 'urdu' ? 'ur' : language === 'arabic' ? 'ar' : 'en';
  }, [language]);

  // Start Model Download / Initialization
  const handleStartDownload = async () => {
    try {
      await initWebLLMEngine(selectedModel, (progress) => {
        setDownloadProgress(progress);
        if (progress.status === 'ready') {
          setIsModelReady(true);
        }
      });
    } catch (err: any) {
      console.warn('[Engine Init Handled]', err);
      setDownloadProgress({
        status: 'error',
        progress: 0,
        text: err?.message || 'WebGPU initialization failed on this device.',
        error: err?.message || 'WebGPU is restricted in this browser. Tap "Start with Instant Offline Engine" to use the app immediately.',
      });
    }
  };

  // Activate Instant Offline Engine (works on all mobile & desktop browsers)
  const handleUseFallbackMode = () => {
    setIsModelReady(true);
    setIsOnboardingModalOpen(false);
  };

  // Handle User Message Submission
  const handleSendMessage = async (text: string, forceWebSearch: boolean = false) => {
    if (!text.trim() || isGenerating) return;

    // 1. Create User Message
    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    await saveChatMessage(userMessage);

    setIsGenerating(true);

    try {
      // 2. Vector RAG: Embed user query and retrieve top 3 relevant memories
      const queryEmbedding = await getEmbedding(text);
      const relevantMemories = searchTopMemories(queryEmbedding, memories, 3, 0.20);

      // Check if user is declaring an explicit personal fact to remember
      const cleanLower = text.toLowerCase().trim();
      const isExplicitFact =
        cleanLower.includes('remember') ||
        cleanLower.includes('yaad') ||
        cleanLower.includes('my name') ||
        cleanLower.includes('mera naam') ||
        cleanLower.includes('i live in') ||
        cleanLower.includes('main rehta') ||
        cleanLower.includes('mera project');

      if (isExplicitFact) {
        const userFactItem: MemoryItem = {
          id: `fact_${Date.now()}_u`,
          text: `[Personal Fact]: ${text}`,
          embedding: queryEmbedding,
          source: 'manual',
          timestamp: Date.now(),
          metadata: { tags: ['user-personal-fact'] },
        };
        await saveMemory(userFactItem);
        setMemories((prev) => [userFactItem, ...prev]);
      }

      // 3. Prepare Assistant Placeholder Message
      const assistantMsgId = `msg_ai_${Date.now()}`;
      let assistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        ragMemories: relevantMemories,
      };

      setMessages([...updatedMessages, assistantMessage]);

      // Detect if prompt is a greeting (Salam, Hello, How are you)
      const isGreeting =
        cleanLower.includes('salam') ||
        cleanLower.includes('سلام') ||
        cleanLower.includes('hello') ||
        cleanLower.includes('hi ') ||
        cleanLower === 'hi' ||
        cleanLower.includes('kaise') ||
        cleanLower.includes('kese') ||
        cleanLower.includes('haal') ||
        cleanLower.includes('who are you') ||
        cleanLower.includes('who made') ||
        cleanLower.includes('kon ho');

      // Detect if we should search online:
      // Search if forceWebSearch OR (not a simple greeting AND we are online AND memory has low confidence or user asks a factual question)
      const shouldSearchOnline =
        navigator.onLine &&
        (forceWebSearch ||
          (!isGreeting &&
            (relevantMemories.length === 0 ||
              (relevantMemories[0]?.metadata?.similarity || 0) < 0.28 ||
              cleanLower.includes('who is') ||
              cleanLower.includes('what is') ||
              cleanLower.includes('tell me') ||
              cleanLower.includes('search') ||
              cleanLower.includes('wikipedia') ||
              cleanLower.includes('history') ||
              cleanLower.includes('kon hai') ||
              cleanLower.includes('kya hai') ||
              cleanLower.includes('batao'))));

      if (shouldSearchOnline) {
        // Autonomous Online Research
        assistantMessage.isSearchingWeb = true;
        assistantMessage.searchQuery = text;
        setMessages([...updatedMessages, assistantMessage]);

        try {
          const wikiData = await searchWikipedia(text);
          assistantMessage.searchResults = wikiData.snippets;
          assistantMessage.isSearchingWeb = false;

          // CRITICAL: Save this new knowledge (query + summary) into IndexedDB so it's trained for offline!
          const newKnowledge = await saveAcquiredWebKnowledge(
            text,
            wikiData.combinedSummary,
            wikiData.titles
          );
          setMemories((prev) => [newKnowledge, ...prev]);

          if (isModelReady && isEngineLoaded()) {
            const systemPrompt = buildSystemPrompt(persona, language, [
              ...relevantMemories,
              newKnowledge,
            ]);
            const finalReply = await generateAIResponse(
              `Based on Wikipedia research:\n${wikiData.combinedSummary}\n\nUser Question: "${text}"\nPlease give a thorough, natural answer in ${language}.`,
              systemPrompt,
              messages.map((m) => ({ role: m.role, content: m.content })),
              (chunk, full) => {
                assistantMessage.content = full;
                setMessages([...updatedMessages, { ...assistantMessage }]);
              }
            );
            assistantMessage.content = finalReply;
          } else {
            assistantMessage.content = generateLocalFallbackResponse(
              text,
              persona,
              language,
              relevantMemories,
              wikiData.snippets
            );
          }
        } catch (searchErr: any) {
          assistantMessage.isSearchingWeb = false;
          assistantMessage.content = generateLocalFallbackResponse(
            text,
            persona,
            language,
            relevantMemories
          );
        }
      } else if (isModelReady && isEngineLoaded()) {
        // WebLLM Inference Path
        const systemPrompt = buildSystemPrompt(persona, language, relevantMemories);

        let accumulatedReply = '';
        const rawReply = await generateAIResponse(
          text,
          systemPrompt,
          messages.map((m) => ({ role: m.role, content: m.content })),
          (token, full) => {
            accumulatedReply = full;
            assistantMessage.content = full;
            setMessages([...updatedMessages, { ...assistantMessage }]);
          }
        );

        // Check if agent requested search
        const searchIntentQuery = detectSearchIntent(rawReply);
        if (searchIntentQuery) {
          assistantMessage.isSearchingWeb = true;
          assistantMessage.searchQuery = searchIntentQuery;
          setMessages([...updatedMessages, { ...assistantMessage }]);

          try {
            const wikiData = await searchWikipedia(searchIntentQuery);
            assistantMessage.searchResults = wikiData.snippets;
            assistantMessage.isSearchingWeb = false;

            const newMem = await saveAcquiredWebKnowledge(
              searchIntentQuery,
              wikiData.combinedSummary,
              wikiData.titles
            );
            setMemories((prev) => [newMem, ...prev]);

            const followUpPrompt = `Wikipedia research for "${searchIntentQuery}":\n${wikiData.combinedSummary}\n\nNow synthesize a complete, professional answer in ${language} for the user.`;
            const synthesizedAnswer = await generateAIResponse(
              followUpPrompt,
              systemPrompt,
              messages.map((m) => ({ role: m.role, content: m.content })),
              (chunk, full) => {
                assistantMessage.content = full;
                setMessages([...updatedMessages, { ...assistantMessage }]);
              }
            );
            assistantMessage.content = synthesizedAnswer;
          } catch (agentErr: any) {
            assistantMessage.isSearchingWeb = false;
            assistantMessage.content = generateLocalFallbackResponse(
              text,
              persona,
              language,
              relevantMemories
            );
          }
        } else {
          assistantMessage.content = rawReply;
        }
      } else {
        // Fast Instant Offline Engine (WebGPU fallback)
        const reply = generateLocalFallbackResponse(
          text,
          persona,
          language,
          relevantMemories
        );
        assistantMessage.content = reply;
      }

      // Save Assistant Message to Chats (NOT polluting memory vault)
      setMessages([...updatedMessages, assistantMessage]);
      await saveChatMessage(assistantMessage);

      // TTS Read-Aloud
      if (ttsEnabled) {
        handlePlaySpeech(assistantMessage);
      }
    } catch (error: any) {
      console.error('[Generate Error]', error);
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `Error during reasoning: ${error.message || 'Engine encountered an issue.'}. Please check the Neural Engine settings in the top bar.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Play Speech Synthesis
  const handlePlaySpeech = (msg: ChatMessage) => {
    setActiveSpeechMessageId(msg.id);
    speakText(
      msg.content,
      language,
      () => setActiveSpeechMessageId(msg.id),
      () => setActiveSpeechMessageId(null)
    );
  };

  const handleStopSpeech = () => {
    stopSpeaking();
    setActiveSpeechMessageId(null);
  };

  // PDF Ingestion Handler
  const handleUploadPDF = async (file: File) => {
    setIsUploadingPDF(true);
    setPdfProgress({ stage: 'reading', progressPct: 5 });

    try {
      const result = await ingestPDF(file, (p) => setPdfProgress(p));
      const updatedVault = await getAllMemories();
      setMemories(updatedVault);

      // Inform user in chat
      const confirmationMsg: ChatMessage = {
        id: `msg_pdf_${Date.now()}`,
        role: 'assistant',
        content: `📄 **Document Ingested Successfully!**\nDocument: "${result.docTitle}"\n• Extracted Pages: ${result.totalPages}\n• Semantic Chunks Vectorized: ${result.chunksCreated}\n\nAll content has been embedded and indexed into your permanent IndexedDB Memory Vault. You can now ask questions about this document completely offline!`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, confirmationMsg]);
      await saveChatMessage(confirmationMsg);

      if (ttsEnabled) {
        handlePlaySpeech(confirmationMsg);
      }
    } catch (err: any) {
      alert(`PDF Ingestion failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploadingPDF(false);
      setPdfProgress(null);
    }
  };

  // Memory Vault Actions
  const handleDeleteMemory = async (id: string) => {
    await deleteMemory(id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  const handleClearAllMemories = async () => {
    await clearAllMemories();
    setMemories([]);
  };

  const handleAddQuickFact = async (factText: string) => {
    const embedding = await getEmbedding(factText);
    const newMemory: MemoryItem = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: factText,
      embedding,
      source: 'manual',
      timestamp: Date.now(),
      metadata: { tags: ['manual-fact'] },
    };
    await saveMemory(newMemory);
    setMemories((prev) => [newMemory, ...prev]);
  };

  // Export Brain Data
  const handleExportBrain = async () => {
    const jsonStr = await exportBrainData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MySecondBrain_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import Brain Data
  const handleImportBrain = async (file: File) => {
    try {
      const text = await file.text();
      const res = await importBrainData(text);
      const reloadedMemories = await getAllMemories();
      const reloadedChats = await getChatHistory();
      setMemories(reloadedMemories);
      setMessages(reloadedChats);
      alert(`Brain Restored Successfully!\n• Memories Imported: ${res.importedMemories}\n• Chats Imported: ${res.importedChats}`);
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070913] text-slate-100 font-sans scanlines">
      {/* Sidebar (Memory Vault & Controls) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        persona={persona}
        onChangePersona={setPersona}
        language={language}
        onChangeLanguage={setLanguage}
        memories={memories}
        onDeleteMemory={handleDeleteMemory}
        onClearAllMemories={handleClearAllMemories}
        onAddQuickFact={handleAddQuickFact}
        onExportBrain={handleExportBrain}
        onImportBrain={handleImportBrain}
        onOpenModelModal={() => setIsOnboardingModalOpen(true)}
        onSelectMemoryForDetail={setInspectingMemory}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <Header
          webgpu={webgpu}
          memoryCount={memories.length}
          isModelReady={isModelReady}
          ttsEnabled={ttsEnabled}
          onToggleTTS={() => {
            if (ttsEnabled) stopSpeaking();
            setTtsEnabled(!ttsEnabled);
          }}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenModelModal={() => setIsOnboardingModalOpen(true)}
        />

        {/* Chat Timeline Area */}
        <ChatArea
          messages={messages}
          isGenerating={isGenerating}
          activeSpeechMessageId={activeSpeechMessageId}
          onPlaySpeech={handlePlaySpeech}
          onStopSpeech={handleStopSpeech}
          language={language}
          persona={persona}
          onSelectPrompt={(p) => handleSendMessage(p)}
          onSelectMemoryForDetail={setInspectingMemory}
        />

        {/* Bottom Input Dock */}
        <InputDock
          onSendMessage={handleSendMessage}
          onUploadPDF={handleUploadPDF}
          isGenerating={isGenerating}
          isUploadingPDF={isUploadingPDF}
          pdfProgress={pdfProgress}
          language={language}
        />
      </div>

      {/* Onboarding & Model Progress Modal */}
      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        webgpu={webgpu}
        downloadProgress={downloadProgress}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        onStartDownload={handleStartDownload}
        onUseFallbackMode={handleUseFallbackMode}
        isModelReady={isModelReady}
      />

      {/* Memory Record Inspector Modal */}
      <MemoryModal
        memory={inspectingMemory}
        onClose={() => setInspectingMemory(null)}
        onDelete={handleDeleteMemory}
      />

      {/* Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
}
