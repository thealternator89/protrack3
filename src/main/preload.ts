import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('database', {
  query: (sql: string, params?: any[]) => ipcRenderer.invoke('db-query', sql, params),
  run: (sql: string, params?: any[]) => ipcRenderer.invoke('db-run', sql, params),
});

contextBridge.exposeInMainWorld('projects', {
  create: (project: { title: string; prefix: string; startDate?: string; dueDate?: string; ownerId?: number }) => 
    ipcRenderer.invoke('create-project', project),
  get: (id: number) => ipcRenderer.invoke('get-project', id),
  update: (project: { id: number; title: string; prefix: string; startDate?: string; dueDate?: string; ownerId?: number }) => 
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

contextBridge.exposeInMainWorld('statuses', {
  getAll: () => ipcRenderer.invoke('get-statuses'),
  create: (status: { label: string; isNew: boolean; isComplete: boolean }) => 
    ipcRenderer.invoke('create-status', status),
  update: (status: { id: number; label: string; isNew: boolean; isComplete: boolean }) => 
    ipcRenderer.invoke('update-status', status),
  delete: (id: number) => ipcRenderer.invoke('delete-status', id),
});

contextBridge.exposeInMainWorld('tasks', {
  get: (id: number) => ipcRenderer.invoke('get-task', id),
  getByProject: (projectId: number) => ipcRenderer.invoke('get-project-tasks', projectId),
  create: (task: { 
    displayId: number;
    title: string; 
    projectId: number; 
    sortOrder: number;
    description?: string; 
    assigneeId?: number; 
    statusId?: number;
    parentId?: number;
  }) => ipcRenderer.invoke('create-task', task),
  update: (task: { 
    id: number;
    title: string; 
    description?: string; 
    assigneeId?: number; 
    statusId?: number;
    parentId?: number;
  }) => ipcRenderer.invoke('update-task', task),
  addPrerequisite: (taskId: number, prerequisiteTaskId: number, type: string) => 
    ipcRenderer.invoke('add-prerequisite', { taskId, prerequisiteTaskId, type }),
  updatePrerequisite: (taskId: number, prerequisiteTaskId: number, type: string) => 
    ipcRenderer.invoke('update-prerequisite', { taskId, prerequisiteTaskId, type }),
  deletePrerequisite: (taskId: number, prerequisiteTaskId: number) => 
    ipcRenderer.invoke('delete-prerequisite', { taskId, prerequisiteTaskId }),
  findByDisplayId: (input: string, currentProjectId: number) => 
    ipcRenderer.invoke('find-task-by-display-id', { input, currentProjectId }),
  updateSortOrders: (updates: { id: number; sortOrder: number }[]) => 
    ipcRenderer.invoke('update-task-orders', updates),
});

contextBridge.exposeInMainWorld('taskSources', {
  getAll: () => ipcRenderer.invoke('get-task-sources'),
  create: (source: { name: string; type: string; config: string }) => 
    ipcRenderer.invoke('create-task-source', source),
  update: (source: { id: number; name: string; type: string; config: string }) => 
    ipcRenderer.invoke('update-task-source', source),
  delete: (id: number) => ipcRenderer.invoke('delete-task-source', id),
});

contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
});
