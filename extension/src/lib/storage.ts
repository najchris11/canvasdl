import type { ParsedExport } from "./zipParser";

const DB_NAME = "canvasdl";
const DB_VERSION = 2;
const STORE_META = "exportMeta";
const STORE_FILES = "exportFiles";
const STORE_ARCHIVE = "archiveOutput";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META);
      if (!db.objectStoreNames.contains(STORE_FILES)) db.createObjectStore(STORE_FILES);
      if (!db.objectStoreNames.contains(STORE_ARCHIVE)) db.createObjectStore(STORE_ARCHIVE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, store: string, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function idbGet<T>(db: IDBDatabase, store: string, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function saveExportMeta(data: ParsedExport): Promise<void> {
  const db = await openDB();
  await idbPut(db, STORE_META, "latest", data);
  db.close();
}

export async function loadExportMeta(): Promise<ParsedExport | undefined> {
  const db = await openDB();
  const result = await idbGet<ParsedExport>(db, STORE_META, "latest");
  db.close();
  return result;
}

export async function saveFileBytes(path: string, bytes: Uint8Array): Promise<void> {
  const db = await openDB();
  await idbPut(db, STORE_FILES, path, bytes);
  db.close();
}

export async function loadFileBytes(path: string): Promise<Uint8Array | undefined> {
  const db = await openDB();
  const result = await idbGet<Uint8Array>(db, STORE_FILES, path);
  db.close();
  return result;
}

// Generated archive ZIP — stored so popup can trigger download after popup reopens
export async function saveArchiveZip(bytes: Uint8Array): Promise<void> {
  const db = await openDB();
  await idbPut(db, STORE_ARCHIVE, "latest", bytes);
  db.close();
}

export async function loadArchiveZip(): Promise<Uint8Array | undefined> {
  const db = await openDB();
  const result = await idbGet<Uint8Array>(db, STORE_ARCHIVE, "latest");
  db.close();
  return result;
}
