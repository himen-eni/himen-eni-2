import { StructureProject, DocumentItem } from '../types';

const DB_NAME = 'eni_document_storage_db';
const DB_VERSION = 1;
const STORE_NAME = 'document_blobs';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    try {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('IndexedDB open error:', request.error);
        reject(request.error);
      };
    } catch (err) {
      reject(err);
    }
  });

  return dbPromise;
}

/**
 * Save large binary data URL in IndexedDB
 */
export async function saveDocumentBlob(docId: string, dataUrl: string): Promise<void> {
  if (!docId || !dataUrl) return;
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.put(dataUrl, docId);
      req.onsuccess = () => resolve();
      req.onerror = () => {
        console.warn('Error saving doc blob to IDB:', req.error);
        resolve(); // non-fatal
      };
    });
  } catch (err) {
    console.warn('IndexedDB save failed:', err);
  }
}

/**
 * Get large binary data URL from IndexedDB
 */
export async function getDocumentBlob(docId: string): Promise<string | null> {
  if (!docId) return null;
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.get(docId);
      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Delete document binary blob from IndexedDB
 */
export async function deleteDocumentBlob(docId: string): Promise<void> {
  if (!docId) return;
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.delete(docId);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // Ignore error
  }
}

/**
 * Strip heavy fileDataUrl from projects structure before saving to LocalStorage
 * to ensure we never hit the 5MB browser localStorage quota limit.
 */
export function sanitizeProjectsForLocalStorage(projects: StructureProject[]): StructureProject[] {
  return projects.map((p) => {
    const cleanSection = (section: any) => {
      if (!section || !section.documents) return section;
      return {
        ...section,
        documents: section.documents.map((doc: DocumentItem) => {
          // If doc has fileDataUrl, save it in IDB in background
          if (doc.fileDataUrl && doc.id) {
            saveDocumentBlob(doc.id, doc.fileDataUrl).catch(() => {});
          }
          // Return document metadata without the huge multi-MB base64 string
          return {
            ...doc,
            fileDataUrl: undefined,
          };
        }),
      };
    };

    return {
      ...p,
      materialIndentStatus: cleanSection(p.materialIndentStatus),
      serviceIndentStatus: cleanSection(p.serviceIndentStatus),
      poStatus: cleanSection(p.poStatus),
      soStatus: cleanSection(p.soStatus),
    };
  });
}

/**
 * Safe LocalStorage setter with QuotaExceeded protection
 */
export function safeSetLocalStorage(key: string, value: any): boolean {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (err: any) {
    console.warn(`LocalStorage quota warning for key ${key}:`, err?.message || err);
    try {
      // Emergency space recovery: clear older caches if needed
      const nonEssentialKeys = Object.keys(localStorage).filter(
        (k) => k !== key && (k.startsWith('temp_') || k.startsWith('cache_'))
      );
      for (const k of nonEssentialKeys) {
        localStorage.removeItem(k);
      }
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch {
      console.warn('LocalStorage save skipped due to quota limits');
      return false;
    }
  }
}
