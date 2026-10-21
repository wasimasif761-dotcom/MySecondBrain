import { WebGPUDiagnostic, ModelDownloadProgress, PersonaId, LanguageId, MemoryItem } from '../types';

export const SUPPORTED_MODELS = [
  {
    id: 'Llama-3-8B-Instruct-q4f32_1-MLC',
    name: 'Llama-3 8B Instruct (Recommended / Default)',
    vram: '~4.5 GB VRAM',
    size: '~2.2 GB Download',
    recommended: true,
  },
  {
    id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 1.7B Instruct (Lightweight / Fast)',
    vram: '~1.8 GB VRAM',
    size: '~900 MB Download',
    recommended: false,
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen2.5 1.5B Instruct (Multilingual Master)',
    vram: '~1.9 GB VRAM',
    size: '~1.1 GB Download',
    recommended: false,
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama-3.2 1B Instruct (Ultra Portable)',
    vram: '~1.2 GB VRAM',
    size: '~750 MB Download',
    recommended: false,
  },
];

let engineInstance: any = null;
let currentLoadedModel: string | null = null;
let webllmModule: any = null;

// Diagnostics: check WebGPU support
export async function checkWebGPUSupport(): Promise<WebGPUDiagnostic> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
    return {
      supported: false,
      error: 'WebGPU is not supported by your current browser or device. Recommended: Google Chrome, Edge, or Arc with Hardware Acceleration enabled.',
    };
  }

  try {
    const gpu = (navigator as any).gpu;
    const adapter = await gpu.requestAdapter();
    if (!adapter) {
      return {
        supported: false,
        error: 'No WebGPU adapter found. Hardware acceleration might be disabled in browser settings or blocked by system drivers.',
      };
    }

    let adapterName = 'GPU Hardware Accelerated';
    let vendor = 'Generic WebGPU Device';
    let architecture = 'Standard';

    if (adapter.info) {
      adapterName = adapter.info.device || adapter.info.description || adapterName;
      vendor = adapter.info.vendor || vendor;
      architecture = adapter.info.architecture || architecture;
    }

    const limits = adapter.limits || {};
    const maxBufferSizeMB = limits.maxBufferSize
      ? Math.round(limits.maxBufferSize / (1024 * 1024))
      : 256;

    return {
      supported: true,
      adapterName,
      vendor,
      architecture,
      maxBufferSizeMB,
    };
  } catch (err: any) {
    return {
      supported: false,
      error: err?.message || 'Error initializing WebGPU adapter.',
    };
  }
}

// Safe dynamic importer for CDN modules
const importCDN = async (url: string): Promise<any> => {
  return new Function('url', 'return import(url)')(url);
};

// Dynamically load WebLLM library
async function getWebLLMLibrary() {
  if (webllmModule) return webllmModule;

  try {
    // CDN import
    webllmModule = await importCDN('https://esm.run/@mlc-ai/web-llm@0.2.78');
    return webllmModule;
  } catch (err) {
    console.warn('[WebLLM] esm.run failed, trying jsdelivr fallback:', err);
    webllmModule = await importCDN('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.78/+esm');
    return webllmModule;
  }
}

// Initialize or switch WebLLM Engine
export async function initWebLLMEngine(
  modelId: string = 'Llama-3-8B-Instruct-q4f32_1-MLC',
  onProgress?: (progress: ModelDownloadProgress) => void
): Promise<any> {
  if (engineInstance && currentLoadedModel === modelId) {
    return engineInstance;
  }

  onProgress?.({
    status: 'checking',
    progress: 5,
    text: 'Verifying WebGPU hardware environment...',
  });

  const gpuDiag = await checkWebGPUSupport();
  if (!gpuDiag.supported) {
    onProgress?.({
      status: 'error',
      progress: 0,
      text: gpuDiag.error || 'WebGPU not available',
      error: gpuDiag.error,
    });
    throw new Error(gpuDiag.error);
  }

  onProgress?.({
    status: 'downloading',
    progress: 10,
    text: `Loading WebLLM module & connecting to weights cache for ${modelId}...`,
  });

  const webllm = await getWebLLMLibrary();

  const progressCallback = (report: any) => {
    const rawProgress = report.progress || 0;
    const pct = Math.min(100, Math.round(rawProgress * 100));
    onProgress?.({
      status: pct >= 100 ? 'compiling' : 'downloading',
      progress: pct,
      text: report.text || `Downloading model shards... ${pct}%`,
      bytesLoaded: report.currentBytes,
      bytesTotal: report.totalBytes,
    });
  };

  try {
    const engine = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback: progressCallback,
      logLevel: 'WARN',
    });

    engineInstance = engine;
    currentLoadedModel = modelId;

    onProgress?.({
      status: 'ready',
      progress: 100,
      text: 'Neural engine loaded & ready for local offline inference.',
    });

    return engineInstance;
  } catch (error: any) {
    console.error('[WebLLM] Engine initialization error:', error);
    onProgress?.({
      status: 'error',
      progress: 0,
      text: error.message || 'Failed to download or compile model onto WebGPU.',
      error: error.message,
    });
    throw error;
  }
}

export function isEngineLoaded(): boolean {
  return engineInstance !== null;
}

export function getCurrentLoadedModel(): string | null {
  return currentLoadedModel;
}

// Build the system prompt tailored to persona, language, and RAG context
export function buildSystemPrompt(
  persona: PersonaId,
  language: LanguageId,
  relevantMemories: MemoryItem[]
): string {
  let personaInstruction = '';
  switch (persona) {
    case 'strict-teacher':
      personaInstruction =
        'Persona: Strict Teacher (سخت استاد). You are an intellectually demanding, precise, and rigorous academic professor. You hold the user to high standards, correct logical mistakes immediately, explain the foundational principles, and do not accept lazy answers.';
      break;
    case 'empathetic-friend':
      personaInstruction =
        'Persona: Empathetic Friend (نرم دوست). You are a warm, supportive, compassionate, and deeply attentive lifelong friend. You listen with heartfelt care, validate feelings, speak tenderly, and offer constructive, comforting advice.';
      break;
    case 'professional-advisor':
      personaInstruction =
        'Persona: Professional Advisor (پروفیشنل ایڈوائزر). You are an elite, data-driven management and technology executive advisor. You deliver clear, structured, strategic, and actionable insights with executive brevity and high impact.';
      break;
  }

  let languageInstruction = '';
  switch (language) {
    case 'urdu':
      languageInstruction =
        'Language: URDU (اردو). You MUST respond purely in natural, grammatically correct Urdu using Urdu script. Do not switch to English unless mentioning technical code or proper nouns.';
      break;
    case 'roman-urdu':
      languageInstruction =
        'Language: ROMAN URDU. You MUST respond in friendly, natural Roman Urdu (e.g. "Main aapki madad karne ke liye tayyar hoon. Aap ka sawal bohot ahem hai...").';
      break;
    case 'arabic':
      languageInstruction =
        'Language: ARABIC (العربية). You MUST respond purely in elegant, fluent Modern Standard Arabic using Arabic script.';
      break;
    case 'hindi':
      languageInstruction =
        'Language: HINDI (हिंदी). You MUST respond in fluent, grammatically sound Hindi using Devanagari script.';
      break;
    case 'english':
      languageInstruction =
        'Language: ENGLISH. You MUST respond in clear, articulate, and engaging English.';
      break;
  }

  let ragContext = '';
  if (relevantMemories.length > 0) {
    ragContext = `\n\n=== LONG-TERM MEMORY CONTEXT (FROM INDEXEDDB VECTOR VAULT) ===\n` +
      relevantMemories
        .map((m, idx) => {
          const src = m.source.toUpperCase();
          const tag = m.metadata?.docTitle ? ` [Doc: ${m.metadata.docTitle}]` : '';
          return `[Memory #${idx + 1} (${src}${tag})]: "${m.text}"`;
        })
        .join('\n') +
      `\n=== END MEMORY CONTEXT ===\nUse the above verified memories to answer the user accurately and recall facts about their life, past conversations, or uploaded documents.`;
  }

  return `You are MySecondBrain, an advanced Offline-First Personal AI Assistant engineered by Waseem Asif.
${personaInstruction}
${languageInstruction}
${ragContext}

=== AGENTIC WEB SEARCH CAPABILITY ===
You are an autonomous intelligence agent. If you do NOT know the exact answer to a factual question, if the question involves recent events, or if you need verified external data, you must output EXACTLY this JSON and nothing else:
{"action": "search", "query": "your search query"}
Otherwise, if you know the answer or can answer using the memory vault above, answer normally. Do NOT output markdown around the JSON when triggering search.`;
}

// Generate response via WebLLM with streaming
export async function generateAIResponse(
  prompt: string,
  systemPrompt: string,
  chatHistory: { role: string; content: string }[],
  onChunk?: (token: string, fullText: string) => void
): Promise<string> {
  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-6).map((c) => ({
      role: c.role === 'user' ? 'user' : 'assistant',
      content: c.content,
    })),
    { role: 'user', content: prompt },
  ];

  if (!engineInstance) {
    throw new Error('WebLLM Engine is not loaded. Please initialize the engine.');
  }

  let fullReply = '';
  const chunks = await engineInstance.chat.completions.create({
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 1024,
  });

  for await (const chunk of chunks) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      fullReply += delta;
      onChunk?.(delta, fullReply);
    }
  }

  return fullReply.trim();
}

// Fallback intelligent responder when WebGPU is not supported by client device
export function generateLocalFallbackResponse(
  prompt: string,
  persona: PersonaId,
  language: LanguageId,
  relevantMemories: MemoryItem[],
  webSearchResults?: string[]
): string {
  const cleanPrompt = prompt.toLowerCase();
  
  // Format based on language
  const greetings: Record<LanguageId, string> = {
    urdu: 'السلام علیکم! میں آپ کا پرسنل سیکنڈ برین اسسٹنٹ ہوں۔',
    'roman-urdu': 'Assalam-o-Alaikum! Main aapka personal Second Brain assistant hoon.',
    arabic: 'مرحباً بك! أنا مساعدك الشخصي للذاكرة الذكية.',
    hindi: 'नमस्ते! मैं आपका पर्सनल सेकंड ब्रेन असिस्टेंट हूँ।',
    english: 'Greetings! I am your personal SecondBrain assistant.',
  };

  let memoryRecall = '';
  if (relevantMemories.length > 0) {
    if (language === 'urdu') {
      memoryRecall = `\n\n📌 آپ کے میموری والٹ سے تلاش کردہ معلومات:\n` +
        relevantMemories.map((m, i) => `${i + 1}. ${m.text}`).join('\n');
    } else if (language === 'roman-urdu') {
      memoryRecall = `\n\n📌 Aapke Memory Vault se mili hui maloomat:\n` +
        relevantMemories.map((m, i) => `${i + 1}. ${m.text}`).join('\n');
    } else {
      memoryRecall = `\n\n📌 Retrieved from your Memory Vault (IndexedDB):\n` +
        relevantMemories.map((m, i) => `• ${m.text}`).join('\n');
    }
  }

  let webSearchSummary = '';
  if (webSearchResults && webSearchResults.length > 0) {
    if (language === 'urdu') {
      webSearchSummary = `\n\n🌐 وکی پیڈیا سے لائیو معلومات حاصل کر کے محفوظ کر لی گئیں:\n` +
        webSearchResults.slice(0, 2).join('\n\n');
    } else {
      webSearchSummary = `\n\n🌐 Live Web Knowledge (Wikipedia verified & stored to offline memory):\n` +
        webSearchResults.slice(0, 2).join('\n\n');
    }
  }

  let personaClosing = '';
  if (persona === 'strict-teacher') {
    personaClosing = language === 'urdu' 
      ? '\n\nیاد رکھیں: مسلسل مشق اور بنیادی اصولوں کو سمجھنا ہی حقیقی علم ہے۔ مزید سوال پوچھیں۔'
      : '\n\nRemember: True mastery requires precision and rigorous practice. What is your next question?';
  } else if (persona === 'empathetic-friend') {
    personaClosing = language === 'urdu'
      ? '\n\nمیں ہمیشہ آپ کے ساتھ ہوں۔ اگر کوئی اور پریشانی یا بات ہو تو بلا جھجھک بتائیں۔'
      : '\n\nI am always here beside you. Never hesitate to share what is on your mind!';
  } else {
    personaClosing = language === 'urdu'
      ? '\n\nیہ تجزیہ مکمل ہے۔ اگلا عملی اقدام بتائیے۔'
      : '\n\nStrategic overview completed. Let me know if you would like to delve deeper.';
  }

  return `${greetings[language]}
${memoryRecall ? memoryRecall : ''}
${webSearchSummary ? webSearchSummary : ''}
${!memoryRecall && !webSearchSummary ? `I have processed your query: "${prompt}". My neural knowledge vault is active, persistent in your browser's IndexedDB, and ready to ingest documents, web data, or voice inputs.` : ''}
${personaClosing}`;
}
