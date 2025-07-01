import type { FileStore, StoredFile } from '@/types';

export function retrieveFiles(store: FileStore) {
  const localList = retrieveList(store);
  if (localList.length === 0) return [];

  const files = [];
  for (const id of localList) {
    const fileInfo = retrieveFile(store, id);
    if (fileInfo) {
      files.push(fileInfo);
    } else {
      localStorage.removeItem(buildFileKey(store, id));
    }
  }

  return files;
}

export function appendFile(store: FileStore, fileId: string, name: string) {
  const localList = retrieveList(store);
  localList.push(fileId);
  localStorage.setItem(buildListKey(store), JSON.stringify(localList));
  localStorage.setItem(buildFileKey(store, fileId), JSON.stringify({ id: fileId, name, status: 'pending' } as StoredFile));
}

export function markFileAsProcessing(store: FileStore, fileId: string) {
  const fileInfo = retrieveFile(store, fileId);
  if (fileInfo) {
    localStorage.setItem(buildFileKey(store, fileId), JSON.stringify({ ...fileInfo, status: 'processing' } as StoredFile));
  }
}

export function markFileAsProcessed(store: FileStore, fileId: string) {
  const fileInfo = retrieveFile(store, fileId);
  if (fileInfo) {
    localStorage.setItem(buildFileKey(store, fileId), JSON.stringify({ ...fileInfo, status: 'processed' } as StoredFile));
  }
}

export function markFileAsFailed(store: FileStore, fileId: string) {
  const fileInfo = retrieveFile(store, fileId);
  if (fileInfo) {
    localStorage.setItem(buildFileKey(store, fileId), JSON.stringify({ ...fileInfo, status: 'failed' } as StoredFile));
  }
}

export function removeFile(store: FileStore, fileId: string) {
  const localList = retrieveList(store);
  const reducedList = localList.filter(item => item !== fileId);
  localStorage.setItem(buildListKey(store), JSON.stringify(reducedList));
  localStorage.removeItem(buildFileKey(store, fileId));
}

function retrieveList(store: FileStore) {
  const localListStr = localStorage.getItem(buildListKey(store)) ?? '';
  return (localListStr ? JSON.parse(localListStr) : []) as string[];
}

function retrieveFile(store: FileStore, fileId: string) {
  const fileInfoStr = localStorage.getItem(buildFileKey(store, fileId));
  return fileInfoStr ? JSON.parse(fileInfoStr) as StoredFile : null;
}

function buildListKey(store: FileStore) {
  return `${store}_files`;
}

function buildFileKey(store: FileStore, fileId: string) {
  return `${store}_files/${fileId}`;
}
