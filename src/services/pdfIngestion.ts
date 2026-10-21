import { MemoryItem } from '../types';
import { getEmbedding } from './embeddings';
import { saveMemoriesBulk } from './db';

// Helper to chunk long text into semantic passages with overlap
export function chunkText(text: string, chunkSize: number = 250, overlap: number = 40): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  if (words.length <= chunkSize) {
    return [words.join(' ')];
  }

  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    chunks.push(chunk);
    i += chunkSize - overlap;
  }
  return chunks;
}

export interface PDFIngestionProgress {
  stage: 'reading' | 'extracting' | 'embedding' | 'saving' | 'done';
  currentPage?: number;
  totalPages?: number;
  currentChunk?: number;
  totalChunks?: number;
  progressPct: number;
}

export async function ingestPDF(
  file: File,
  onProgress?: (p: PDFIngestionProgress) => void
): Promise<{ docTitle: string; totalPages: number; chunksCreated: number; memories: MemoryItem[] }> {
  // Check if pdf.js is loaded
  const pdfjs = (window as any).pdfjsLib;
  if (!pdfjs) {
    throw new Error('PDF.js library is not yet initialized. Please check network connection.');
  }

  onProgress?.({
    stage: 'reading',
    progressPct: 10,
  });

  const arrayBuffer = await file.arrayBuffer();

  onProgress?.({
    stage: 'extracting',
    progressPct: 20,
  });

  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;
  const totalPages = pdfDocument.numPages;

  const extractedPages: { pageNum: number; text: string }[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str || '')
      .join(' ')
      .trim();

    if (pageText.length > 0) {
      extractedPages.push({ pageNum, text: pageText });
    }

    onProgress?.({
      stage: 'extracting',
      currentPage: pageNum,
      totalPages,
      progressPct: Math.round(20 + (pageNum / totalPages) * 30),
    });
  }

  if (extractedPages.length === 0) {
    throw new Error('No readable text found in PDF. It might be scanned or image-only.');
  }

  // Create semantic chunks
  const allRawChunks: { text: string; pageNum: number }[] = [];
  for (const page of extractedPages) {
    const chunks = chunkText(page.text, 200, 40);
    for (const chunk of chunks) {
      if (chunk.length > 20) {
        allRawChunks.push({ text: chunk, pageNum: page.pageNum });
      }
    }
  }

  const totalChunks = allRawChunks.length;
  onProgress?.({
    stage: 'embedding',
    totalChunks,
    currentChunk: 0,
    progressPct: 50,
  });

  const createdMemories: MemoryItem[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const item = allRawChunks[i];
    const textWithContext = `[Document: ${file.name} | Page ${item.pageNum}]\n${item.text}`;
    
    // Generate vector embedding
    const embedding = await getEmbedding(textWithContext);

    const memoryItem: MemoryItem = {
      id: `pdf_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      text: textWithContext,
      embedding,
      source: 'pdf',
      timestamp: Date.now(),
      metadata: {
        docTitle: file.name,
        page: item.pageNum,
        tags: ['pdf', file.name],
      },
    };

    createdMemories.push(memoryItem);

    onProgress?.({
      stage: 'embedding',
      currentChunk: i + 1,
      totalChunks,
      progressPct: Math.round(50 + ((i + 1) / totalChunks) * 40),
    });
  }

  onProgress?.({
    stage: 'saving',
    progressPct: 95,
  });

  // Bulk save into IndexedDB
  await saveMemoriesBulk(createdMemories);

  onProgress?.({
    stage: 'done',
    progressPct: 100,
  });

  return {
    docTitle: file.name,
    totalPages,
    chunksCreated: createdMemories.length,
    memories: createdMemories,
  };
}
