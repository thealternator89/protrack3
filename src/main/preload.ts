import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('database', {
  query: (sql: string, params?: any[]) => ipcRenderer.invoke('db-query', sql, params),
  run: (sql: string, params?: any[]) => ipcRenderer.invoke('db-run', sql, params),
});

contextBridge.exposeInMainWorld('projects', {
  create: (project: { title: string; startDate?: string; dueDate?: string }) => 
    ipcRenderer.invoke('create-project', project),
});
