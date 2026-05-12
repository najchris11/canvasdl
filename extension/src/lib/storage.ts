import type { ParsedExport } from "./zipParser";

const DB_NAME = "canvasdl";
const DB_VERSION = 1;
const STORE_META = "exportMeta";
const STORE_FILES = "exportFiles";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_META);
      req.result.createObjectStore(STORE_FILES);
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

// Saves the parsed export metadata (no file bytes — those stay in the ZIP).
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

// Saves a file's raw bytes keyed by its ZIP path, for later use during archiving.
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
