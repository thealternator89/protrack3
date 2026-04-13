export interface Project {
  Id: number;
  Title: string;
  Prefix: string;
  StartDate: string | null;
  DueDate: string | null;
  OwnerId: number | null;
  TaskSourceId: number | null;
}

export interface Person {
  Id: number;
  Name: string;
  Email: string;
  Color: string | null;
}

export interface Status {
  Id: number;
  Label: string;
  IsNew: number; // SQLite stored as 0 or 1
  IsComplete: number; // SQLite stored as 0 or 1
}

export interface Task {
  Id: number;
  DisplayId: number;
  Title: string;
  Description: string | null;
  SortOrder: number;
  ProjectId: number;
  AssigneeId: number | null;
  StatusId: number | null;
  ParentId: number | null;
  RemoteTaskId: number | null;
  // Joined fields
  AssigneeName?: string;
  StatusLabel?: string;
  IsComplete?: number;
  ParentTitle?: string;
}

export interface TaskPrerequisite {
  TaskId: number;
  PrerequisiteTaskId: number;
  Type: string;
  // Joined fields
  PrerequisiteIsComplete?: number;
  PrerequisiteTaskTitle?: string;
  DependentTaskTitle?: string;
  DependentIsComplete?: number;
}

export interface TaskSource {
  Id: number;
  Name: string;
  Type: string;
  Config: string;
}

export interface StatusMap {
  TaskSourceId: number;
  StatusId: number;
  SourceName: string;
}

export interface DatabaseAPI {
  query: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
  run: (sql: string, params?: any[]) => Promise<any>;
}

export interface ProjectsAPI {
  create: (project: { title: string; prefix: string; startDate?: string; dueDate?: string; ownerId?: number }) => Promise<any>;
  get: (id: number) => Promise<Project>;
  update: (project: { id: number; title: string; prefix: string; startDate?: string; dueDate?: string; ownerId?: number }) => Promise<any>;
}

export interface PeopleAPI {
  getAll: () => Promise<Person[]>;
  create: (person: { name: string; email: string; color?: string }) => Promise<any>;
  update: (person: { id: number; name: string; email: string; color?: string }) => Promise<any>;
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
  }) => Promise<any>;
  addPrerequisite: (taskId: number, prerequisiteTaskId: number, type: string) => Promise<any>;
  updatePrerequisite: (taskId: number, prerequisiteTaskId: number, type: string) => Promise<any>;
  deletePrerequisite: (taskId: number, prerequisiteTaskId: number) => Promise<any>;
  findByDisplayId: (input: string, currentProjectId: number) => Promise<{ Id: number } | null>;
}

declare global {
  interface Window {
    database: DatabaseAPI;
    projects: ProjectsAPI;
    people: PeopleAPI;
    statuses: StatusesAPI;
    tasks: TasksAPI;
  }
}
