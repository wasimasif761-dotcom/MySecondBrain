import { MemoryItem } from '../types';
import { getEmbedding } from './embeddings';
import { saveMemory } from './db';

export interface SearchResult {
  query: string;
  titles: string[];
  snippets: string[];
  detailedExtract: string;
  combinedSummary: string;
}

// Detect if AI outputted agent search JSON command
export function detectSearchIntent(text: string): string | null {
  if (!text) return null;

  // Exact or embedded JSON match
  try {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed);
      if (parsed.action === 'search' && typeof parsed.query === 'string' && parsed.query.trim()) {
        return parsed.query.trim();
      }
    }
  } catch (e) {
    // not pure json, continue to regex
  }

  // Regex extraction for action search
  const regex = /["']action["']\s*:\s*["']search["']\s*,\s*["']query["']\s*:\s*["']([^"']+)["']/i;
  const match = text.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }

  // Alternative query first then action
  const regex2 = /["']query["']\s*:\s*["']([^"']+)["']\s*,\s*["']action["']\s*:\s*["']search["']/i;
  const match2 = text.match(regex2);
  if (match2 && match2[1]) {
    return match2[1].trim();
  }

  return null;
}

// Strip HTML tags from Wikipedia snippets
function cleanSnippet(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
}

// Fetch search knowledge from Wikipedia API
export async function searchWikipedia(query: string): Promise<SearchResult> {
  const endpoint = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    query
  )}&format=json&origin=*`;

  try {
    const res = await fetch(endpoint, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`Wikipedia API responded with status ${res.status}`);
    }

    const data = await res.json();
    const searchList = data?.query?.search || [];

    if (searchList.length === 0) {
      return {
        query,
        titles: [],
        snippets: [],
        detailedExtract: `No live Wikipedia records found for query "${query}".`,
        combinedSummary: `No online results found for query: "${query}".`,
      };
    }

    const titles = searchList.slice(0, 3).map((item: any) => item.title);
    const snippets = searchList.slice(0, 3).map((item: any) => cleanSnippet(item.snippet));

    // Fetch in-depth introductory extract of the #1 match
    let detailedExtract = '';
    const topTitle = titles[0];
    if (topTitle) {
      try {
        const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(
          topTitle
        )}&format=json&origin=*`;
        const extractRes = await fetch(extractUrl);
        const extractData = await extractRes.json();
        const pages = extractData?.query?.pages || {};
        const firstPageId = Object.keys(pages)[0];
        if (firstPageId && pages[firstPageId]?.extract) {
          detailedExtract = pages[firstPageId].extract;
        }
      } catch (err) {
        console.warn('[Search] Failed to fetch detailed Wikipedia extract:', err);
      }
    }

    const combinedSummary = [
      `Wikipedia Search Results for: "${query}"`,
      ...snippets.map((snip: string, i: number) => `[Source ${i + 1} - ${titles[i]}]: ${snip}`),
      detailedExtract ? `\nOverview: ${detailedExtract.slice(0, 1000)}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      query,
      titles,
      snippets,
      detailedExtract,
      combinedSummary,
    };
  } catch (error: any) {
    console.error('[Search] Wikipedia fetch error:', error);
    throw new Error(`Web Search failed: ${error.message || 'Network disconnected'}`);
  }
}

// CRITICAL: Save acquired knowledge into IndexedDB Memory Vault so it works offline forever
export async function saveAcquiredWebKnowledge(
  query: string,
  summary: string,
  titles: string[] = []
): Promise<MemoryItem> {
  const fullText = `[Web Search: ${query}]\n${summary}`;
  const embedding = await getEmbedding(fullText);

  const memory: MemoryItem = {
    id: `web_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    text: fullText,
    embedding,
    source: 'web-search',
    timestamp: Date.now(),
    metadata: {
      query,
      docTitle: titles.length > 0 ? titles[0] : 'Web Knowledge',
      tags: ['web-search', 'wikipedia', ...titles],
    },
  };

  await saveMemory(memory);
  console.log(`[Memory Vault] Successfully memorized web knowledge for: "${query}"`);
  return memory;
}
