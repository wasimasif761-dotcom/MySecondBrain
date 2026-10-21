import { MemoryItem } from '../types';

let extractorPromise: Promise<any> | null = null;
let isTransformersLoaded = false;

// Cosine similarity between two vectors
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const len = Math.min(vecA.length, vecB.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Fallback semantic n-gram & word hash vectorizer (384 dimensions, matching all-MiniLM-L6-v2)
// Ensures 100% offline functionality immediately even before external model loads
function fallbackEmbed(text: string): number[] {
  const dims = 384;
  const vec = new Float32Array(dims);
  const clean = text.toLowerCase().trim();
  if (!clean) return Array.from(vec);

  const tokens = clean.split(/\s+/);
  
  // Hash function (FNV-1a variant)
  function hashStr(str: string): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    const h1 = hashStr(word);
    const idx1 = h1 % dims;
    const sign1 = (h1 % 2 === 0) ? 1 : -1;
    vec[idx1] += sign1 * 1.5;

    // Subword character n-grams (3-grams) for cross-lingual / typo resilience
    for (let c = 0; c < word.length - 2; c++) {
      const tri = word.slice(c, c + 3);
      const hTri = hashStr(tri);
      const idxTri = hTri % dims;
      vec[idxTri] += 0.4;
    }

    // Word bigram
    if (i < tokens.length - 1) {
      const bigram = word + '_' + tokens[i + 1];
      const h2 = hashStr(bigram);
      const idx2 = h2 % dims;
      vec[idx2] += 1.0;
    }
  }

  // L2 Normalize
  let norm = 0;
  for (let i = 0; i < dims; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dims; i++) {
      vec[i] /= norm;
    }
  }

  return Array.from(vec);
}

// Safe runtime dynamic import for CDN URLs
const importCDN = async (url: string): Promise<any> => {
  return new Function('url', 'return import(url)')(url);
};

// Initialize Transformers.js pipeline
async function initPipeline() {
  if (extractorPromise) return extractorPromise;

  extractorPromise = (async () => {
    try {
      // Dynamic import from CDN
      const transformersModule: any = await importCDN('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2');
      const { pipeline, env } = transformersModule;

      if (env) {
        env.allowLocalModels = false;
        env.useBrowserCache = true;
      }

      const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true,
      });

      isTransformersLoaded = true;
      console.log('[RAG] Transformers.js Xenova/all-MiniLM-L6-v2 loaded successfully.');
      return extractor;
    } catch (err) {
      console.warn('[RAG] Transformers.js CDN loading failed or offline. Using embedded semantic vectorizer.', err);
      return null;
    }
  })();

  return extractorPromise;
}

// Generate embedding for text
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const extractor = await initPipeline();
    if (extractor && isTransformersLoaded) {
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data as Float32Array);
    }
  } catch (error) {
    console.warn('[RAG] Model inference fallback:', error);
  }

  return fallbackEmbed(text);
}

// Search Top-K most relevant memories for a query
export function searchTopMemories(
  queryVector: number[],
  memories: MemoryItem[],
  topK: number = 3,
  minSimilarity: number = 0.12
): MemoryItem[] {
  if (!memories || memories.length === 0 || !queryVector) return [];

  const scored = memories.map((mem) => {
    const score = cosineSimilarity(queryVector, mem.embedding);
    return {
      ...mem,
      metadata: {
        ...(mem.metadata || {}),
        similarity: Math.round(score * 100) / 100,
      },
      _score: score,
    };
  });

  // Filter and sort descending
  const relevant = scored
    .filter((m) => m._score >= minSimilarity)
    .sort((a, b) => b._score - a._score);

  return relevant.slice(0, topK);
}
