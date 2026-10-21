import { MemoryItem, ChatMessage } from '../types';

const DB_NAME = 'MySecondBrainDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Memories store for RAG
      if (!db.objectStoreNames.contains('memories')) {
        const memStore = db.createObjectStore('memories', { keyPath: 'id' });
        memStore.createIndex('timestamp', 'timestamp', { unique: false });
        memStore.createIndex('source', 'source', { unique: false });
      }

      // Chat history store
      if (!db.objectStoreNames.contains('chats')) {
        const chatStore = db.createObjectStore('chats', { keyPath: 'id' });
        chatStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // App Settings / Model cache metadata
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// Save a memory (Conversation, Web-search summary, PDF chunk, etc.)
export async function saveMemory(memory: MemoryItem): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('memories', 'readwrite');
    const store = tx.objectStore('memories');
    const req = store.put(memory);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Bulk save memories (e.g. for PDF ingestion or import)
export async function saveMemoriesBulk(memories: MemoryItem[]): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('memories', 'readwrite');
    const store = tx.objectStore('memories');
    for (const mem of memories) {
      store.put(mem);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Get all memories
export async function getAllMemories(): Promise<MemoryItem[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('memories', 'readonly');
    const store = tx.objectStore('memories');
    const index = store.index('timestamp');
    const req = index.getAll();
    req.onsuccess = () => {
      const items = (req.result || []) as MemoryItem[];
      // Return newest first
      resolve(items.reverse());
    };
    req.onerror = () => reject(req.error);
  });
}

// Delete a single memory
export async function deleteMemory(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('memories', 'readwrite');
    const store = tx.objectStore('memories');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Clear all memories
export async function clearAllMemories(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('memories', 'readwrite');
    const store = tx.objectStore('memories');
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Chat history operations
export async function saveChatMessage(msg: ChatMessage): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chats', 'readwrite');
    const store = tx.objectStore('chats');
    const req = store.put(msg);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getChatHistory(): Promise<ChatMessage[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chats', 'readonly');
    const store = tx.objectStore('chats');
    const index = store.index('timestamp');
    const req = index.getAll();
    req.onsuccess = () => resolve((req.result || []) as ChatMessage[]);
    req.onerror = () => reject(req.error);
  });
}

export async function clearChatHistory(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('chats', 'readwrite');
    const store = tx.objectStore('chats');
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Export Brain as JSON
export async function exportBrainData(): Promise<string> {
  const memories = await getAllMemories();
  const chats = await getChatHistory();
  const exportPayload = {
    appName: 'MySecondBrain',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    author: 'Waseem Asif',
    memoriesCount: memories.length,
    chatsCount: chats.length,
    memories,
    chats,
  };
  return JSON.stringify(exportPayload, null, 2);
}

// Import Brain from JSON
export async function importBrainData(jsonString: string): Promise<{ importedMemories: number; importedChats: number }> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.memories || !Array.isArray(data.memories)) {
      throw new Error('Invalid Brain backup file format: missing memories array.');
    }

    if (data.memories.length > 0) {
      await saveMemoriesBulk(data.memories);
    }

    let importedChats = 0;
    if (data.chats && Array.isArray(data.chats)) {
      for (const chat of data.chats) {
        await saveChatMessage(chat);
        importedChats++;
      }
    }

    return {
      importedMemories: data.memories.length,
      importedChats,
    };
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to parse JSON file.');
  }
}
