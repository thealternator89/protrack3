import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('database', {
  query: (sql: string, params?: any[]) => ipcRenderer.invoke('db-query', sql, params),
  run: (sql: string, params?: any[]) => ipcRenderer.invoke('db-run', sql, params),
});

contextBridge.exposeInMainWorld('projects', {
  create: (project: { title: string; startDate?: string; dueDate?: string; ownerId?: number }) => 
    ipcRenderer.invoke('create-project', project),
  get: (id: number) => ipcRenderer.invoke('get-project', id),
  update: (project: { id: number; title: string; startDate?: string; dueDate?: string; ownerId?: number }) => 
    ipcRenderer.invoke('update-project', project),
});

contextBridge.exposeInMainWorld('people', {
  getAll: () => ipcRenderer.invoke('get-people'),
  create: (person: { name: string; email: string; color?: string }) => 
    ipcRenderer.invoke('create-person', person),
  update: (person: { id: number; name: string; email: string; color?: string }) => 
    ipcRenderer.invoke('update-person', person),
  delete: (id: number) => ipcRenderer.invoke('delete-person', id),
});

contextBridge.exposeInMainWorld('types', {
  getAll: () => ipcRenderer.invoke('get-types'),
  create: (type: { label: string; color: string; icon: string }) => 
    ipcRenderer.invoke('create-type', type),
  update: (type: { id: number; label: string; color: string; icon: string }) => 
    ipcRenderer.invoke('update-type', type),
  delete: (id: number) => ipcRenderer.invoke('delete-type', id),
});

contextBridge.exposeInMainWorld('statuses', {
  getAll: () => ipcRenderer.invoke('get-statuses'),
  create: (status: { label: string; isComplete: boolean }) => 
    ipcRenderer.invoke('create-status', status),
  update: (status: { id: number; label: string; isComplete: boolean }) => 
    ipcRenderer.invoke('update-status', status),
  delete: (id: number) => ipcRenderer.invoke('delete-status', id),
});
