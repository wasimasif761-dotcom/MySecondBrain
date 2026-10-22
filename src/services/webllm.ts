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
  const clean = prompt.toLowerCase().trim();

  // Detect Greetings (Salam, Hi, Hello)
  const isSalam = clean.includes('salam') || clean.includes('سلام') || clean.includes('slaam');
  const isHowAreYou = clean.includes('kaise') || clean.includes('kese') || clean.includes('haal') || clean.includes('how are you') || clean.includes('کیسے');
  const isIdentityQuestion = clean.includes('who are you') || clean.includes('who made') || clean.includes('kon ho') || clean.includes('kis ne banaya') || clean.includes('کون ہو') || clean.includes('کس نے بنایا') || clean.includes('creator');
  const isNameQuestion = clean.includes('mera naam') || clean.includes('my name') || clean.includes('میرا نام');

  // 1. Identity & Creator Question
  if (isIdentityQuestion) {
    if (language === 'urdu') {
      return `میرا نام **MySecondBrain** ہے! مجھے **وسیم آصف (Waseem Asif)** نے بطور ایک آف لائن پرسنل اسسٹنٹ تیار کیا ہے۔\n\nمیری خاص بات یہ ہے کہ میں آپ کی دستاویزات، نوٹس اور انٹرنیٹ سے سیکھی گئی معلومات کو آپ کے موبائل کی میموری (IndexedDB) میں مستقل یاد رکھتا ہوں تاکہ آپ کو انٹرنیٹ کے بغیر بھی بوقت ضرورت مدد مل سکے۔\n\nڈویلپر فیڈبیک ای میل: wasimasif761@gmail.com`;
    } else if (language === 'roman-urdu') {
      return `Mera naam **MySecondBrain** hai! Mujhe **Waseem Asif** ne بطور ek offline-first personal AI assistant banaya hai.\n\nMain aapki zaroori baatein, documents aur online seekhi hui maloomat ko aapke device ki IndexedDB memory mein save rakhta hoon taake aapko offline bhi foran jawab mil sake.\n\nAuthor Contact: wasimasif761@gmail.com`;
    } else {
      return `I am **MySecondBrain**, an Offline-First Personal AI Assistant engineered by **Waseem Asif** (wasimasif761@gmail.com).\n\nI operate 100% privately inside your browser using Vector RAG in IndexedDB, autonomous Wikipedia web research, and multilingual speech. How can I assist you today?`;
    }
  }

  // 2. Greetings (Salam)
  if (isSalam) {
    if (language === 'urdu' || clean.includes('سلام') || clean.includes('salam')) {
      return `وعلیکم السلام ورحمۃ اللہ وبرکاتہ!\n\nخوش آمدید! میں آپ کا سیکنڈ برین اسسٹنٹ ہوں۔ فرمائیے، میں آپ کی کیا مدد کر سکتا ہوں؟ آپ مجھ سے کوئی بھی علمی، سائنسی، تاریخی سوال پوچھ سکتے ہیں، یا اپنی کوئی ذاتی بات یاد رکھنے کے لیے کہہ سکتے ہیں۔`;
    } else if (language === 'roman-urdu') {
      return `Walaikum Assalam wa Rahmatullahi wa Barakatuhu!\n\nKhush aamdeed! Main aapka Second Brain assistant hoon. Batayein aaj main aapki kya madad karoon? Aap mujhse koi bhi sawal pooch sakte hain ya koi nayi baat yaad karwa sakte hain.`;
    } else {
      return `Walaikum Assalam and warm greetings!\n\nWelcome to your SecondBrain. I am ready to help you recall facts, summarize documents, or research any topic online and store it offline. What is on your mind?`;
    }
  }

  // 3. How are you?
  if (isHowAreYou) {
    if (language === 'urdu') {
      return `الحمدللہ، میں بالکل ٹھیک اور مستعد ہوں! آپ سنائیے، آپ کی صحت کیسی ہے اور دن کیسا گزر رہا ہے؟`;
    } else if (language === 'roman-urdu') {
      return `Alhamdulillah, main bilkul theek aur tayyar hoon! Aap sunayein, aap ki tabiyat kaisi hai aur din kaisa guzar raha hai?`;
    } else {
      return `I am operating smoothly and ready to assist! How are you doing today?`;
    }
  }

  // 4. Name Question ("What is my name?" / "Mera naam kya hai?")
  if (isNameQuestion) {
    const nameMemory = relevantMemories.find((m) =>
      m.text.toLowerCase().includes('name is') ||
      m.text.toLowerCase().includes('naam') ||
      m.text.toLowerCase().includes('نام')
    );
    if (nameMemory) {
      if (language === 'urdu') {
        return `میرے میموری والٹ کے مطابق:\n${nameMemory.text}`;
      } else {
        return `Based on your Memory Vault records:\n${nameMemory.text}`;
      }
    }
  }

  // 5. Synthesis with Web Search Results (Autonomous Learning)
  if (webSearchResults && webSearchResults.length > 0) {
    const rawFacts = webSearchResults.slice(0, 3).join('\n\n');
    if (language === 'urdu') {
      return `🌐 **وکی پیڈیا سے تصدیق شدہ معلومات حاصل کر کے آف لائن میموری میں محفوظ کر دی گئی ہیں:**\n\n${rawFacts}\n\n✅ **آف لائن ٹریننگ مکمل:** اب اگلی بار آپ یہ سوال انٹرنیٹ کے بغیر بھی پوچھیں گے تو میں اپنے محفوظ کردہ میموری والٹ سے فورا جواب دوں گا!`;
    } else if (language === 'roman-urdu') {
      return `🌐 **Wikipedia se live maloomat hasil kar ke offline memory mein store kar di gayi hain:**\n\n${rawFacts}\n\n✅ **Offline Trained:** Ab next time aap internet ke baghair bhi yeh sawal poochein ge to main foran apne Memory Vault se jawab doon ga!`;
    } else {
      return `🌐 **Online Findings Verified & Memorized into Offline Vault:**\n\n${rawFacts}\n\n✅ **Permanent Offline Ingestion:** This knowledge has been embedded and saved to your IndexedDB vault, ready for offline recall next time!`;
    }
  }

  // 6. Synthesis with Relevant RAG Memories
  // Filter out any self-referencing repetitive prompt dumps
  const cleanMemories = relevantMemories.filter((m) => {
    const txt = m.text.toLowerCase();
    return !txt.startsWith('user query:') && !txt.includes('my neural knowledge vault is active');
  });

  if (cleanMemories.length > 0) {
    const topMem = cleanMemories[0];
    const otherMems = cleanMemories.slice(1);

    if (language === 'urdu') {
      return `📌 **آپ کے میموری والٹ سے حاصل کردہ معلومات:**\n\n${topMem.text}\n\n${
        otherMems.length > 0 ? otherMems.map((m, i) => `${i + 2}. ${m.text}`).join('\n\n') : ''
      }`;
    } else if (language === 'roman-urdu') {
      return `📌 **Aapke Memory Vault se mili hui maloomat:**\n\n${topMem.text}\n\n${
        otherMems.length > 0 ? otherMems.map((m, i) => `${i + 2}. ${m.text}`).join('\n\n') : ''
      }`;
    } else {
      return `📌 **Retrieved from your Personal Memory Vault:**\n\n${topMem.text}\n\n${
        otherMems.length > 0 ? otherMems.map((m, i) => `• ${m.text}`).join('\n\n') : ''
      }`;
    }
  }

  // 7. General Knowledgeable Response
  if (language === 'urdu') {
    return `آپ کا سوال موصول ہوا: "${prompt}"۔\n\nفی الوقت اس سوال کا جواب میموری والٹ میں موجود نہیں تھا۔ اگر آپ آن لائن ہیں تو سرچ بار کے ساتھ موجود 🌐 گلوب بٹن دبا کر وکی پیڈیا سے لائیو معلومات لا کر ہمیشہ کے لیے آف لائن محفوظ کر سکتے ہیں!`;
  } else if (language === 'roman-urdu') {
    return `Aapka sawal mila: "${prompt}"۔\n\nAbhi yeh baat memory vault mein nahi mili. Agar aap online hain to input bar mein 🌐 Globe button on kar ke Wikipedia se live knowledge hasil kar ke hamesha ke liye offline save kar sakte hain!`;
  } else {
    return `I received your question: "${prompt}".\n\nI don't have this recorded in your local memory vault yet. Toggle the 🌐 Web icon in the bottom input bar to automatically fetch from Wikipedia and permanently store it offline!`;
  }
}
