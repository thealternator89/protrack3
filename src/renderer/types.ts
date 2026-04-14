import { Project, Person, Status, Task, TaskPrerequisite, TaskSource, StatusMap } from '../shared/types';
export { Project, Person, Status, Task, TaskPrerequisite, TaskSource, StatusMap };

export interface DatabaseAPI {
  query: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
  run: (sql: string, params?: any[]) => Promise<any>;
}

export interface ProjectsAPI {
  create: (project: { title: string; prefix: string; startDate?: string; dueDate?: string; ownerId?: number; taskSourceId?: number }) => Promise<any>;
  get: (id: number) => Promise<Project>;
  update: (project: { id: number; title: string; prefix: string; startDate?: string; dueDate?: string; ownerId?: number; taskSourceId?: number }) => Promise<any>;
}

export interface PeopleAPI {
  getAll: () => Promise<Person[]>;
  create: (person: { name: string; email: string; color?: Person['Color'] }) => Promise<any>;
  update: (person: { id: number; name: string; email: string; color?: Person['Color'] }) => Promise<any>;
  delete: (id: number) => Promise<any>;
}

export interface StatusesAPI {
  getAll: () => Promise<Status[]>;
  create: (status: { label: string; isNew: boolean; isComplete: boolean }) => Promise<any>;
  update: (status: { id: number; label: string; isNew: boolean; isComplete: boolean }) => Promise<any>;
  delete: (id: number) => Promise<any>;
}

export interface TasksAPI {
  get: (id: number) => Promise<{ 
    task: Task; 
    prerequisites: TaskPrerequisite[];
    dependedOnBy: TaskPrerequisite[];
  }>;
  getByProject: (projectId: number) => Promise<{ tasks: Task[]; prerequisites: TaskPrerequisite[] }>;
  create: (task: { 
    displayId: number;
    title: string; 
    projectId: number; 
    sortOrder: number;
    description?: string; 
    assigneeId?: number; 
    statusId?: number;
    parentId?: number;
    remoteTaskId?: number;
  }) => Promise<any>;
  update: (task: { 
    id: number;
    title: string; 
    description?: string; 
    assigneeId?: number; 
    statusId?: number;
    parentId?: number;
    remoteTaskId?: number;
  }) => Promise<any>;
  addPrerequisite: (taskId: number, prerequisiteTaskId: number, type: string) => Promise<any>;
  updatePrerequisite: (taskId: number, prerequisiteTaskId: number, type: string) => Promise<any>;
  deletePrerequisite: (taskId: number, prerequisiteTaskId: number) => Promise<any>;
  findByDisplayId: (input: string, currentProjectId: number) => Promise<{ Id: number } | null>;
  updateSortOrders: (updates: { id: number; sortOrder: number }[]) => Promise<any>;
  importFromSource: (projectId: number, taskSourceId: number, workItemIds: string) => Promise<void>;
}

export interface TaskSourcesAPI {
  getAll: () => Promise<TaskSource[]>;
  create: (source: { name: string; type: string; config: string }) => Promise<any>;
  update: (source: { id: number; name: string; type: string; config: string }) => Promise<any>;
  delete: (id: number) => Promise<any>;
}

export interface StatusMapsAPI {
  getByTaskSourceId: (taskSourceId: number) => Promise<StatusMap[]>;
  update: (taskSourceId: number, maps: { statusId: number; sourceName: string }[]) => Promise<any>;
}

export interface ElectronAPI {
  openExternal: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    database: DatabaseAPI;
    projects: ProjectsAPI;
    people: PeopleAPI;
    statuses: StatusesAPI;
    tasks: TasksAPI;
    taskSources: TaskSourcesAPI;
    statusMaps: StatusMapsAPI;
    electronAPI: ElectronAPI;
  }
}
