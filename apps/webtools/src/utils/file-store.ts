export type FileStore = 'extract-audio' | 'remove-audio' | 'trim' | 'scale' | 'transcode';

export function retrieveFiles(store: FileStore) {
  const localList = retrieveList(store);
  if (localList.length === 0) return [];

  const files = [];
  for (const id of localList) {
    const name = localStorage.getItem(buildFileKey(store, id));
    if (name) {
      files.push({ id, name });
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
  localStorage.setItem(buildFileKey(store, fileId), name);
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

function buildListKey(store: FileStore) {
  return `${store}_files`;
}

function buildFileKey(store: FileStore, fileId: string) {
  return `${store}_files/${fileId}`;
}
