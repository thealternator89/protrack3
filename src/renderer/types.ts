export interface Project {
  Id: number;
  Title: string;
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

export interface Type {
  Id: number;
  Label: string;
  Color: string;
  Icon: string;
}

export interface Status {
  Id: number;
  Label: string;
  IsComplete: number; // SQLite stored as 0 or 1
}

export interface Task {
  Id: number;
  Title: string;
  Description: string | null;
  ProjectId: number;
  AssigneeId: number | null;
  StatusId: number | null;
  TypeId: number | null;
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
  PrerequisiteType: string;
  // Joined fields
  PrerequisiteIsComplete?: number;
  PrerequisiteTaskTitle?: string;
  DependentTaskTitle?: string;
  DependentIsComplete?: number;
}

export interface DatabaseAPI {
  query: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
  run: (sql: string, params?: any[]) => Promise<any>;
}

export interface ProjectsAPI {
  create: (project: { title: string; startDate?: string; dueDate?: string; ownerId?: number }) => Promise<any>;
  get: (id: number) => Promise<Project>;
  update: (project: { id: number; title: string; startDate?: string; dueDate?: string; ownerId?: number }) => Promise<any>;
}

export interface PeopleAPI {
  getAll: () => Promise<Person[]>;
  create: (person: { name: string; email: string; color?: string }) => Promise<any>;
  update: (person: { id: number; name: string; email: string; color?: string }) => Promise<any>;
  delete: (id: number) => Promise<any>;
}

export interface TypesAPI {
  getAll: () => Promise<Type[]>;
  create: (type: { label: string; color: string; icon: string }) => Promise<any>;
  update: (type: { id: number; label: string; color: string; icon: string }) => Promise<any>;
  delete: (id: number) => Promise<any>;
}

export interface StatusesAPI {
  getAll: () => Promise<Status[]>;
  create: (status: { label: string; isComplete: boolean }) => Promise<any>;
  update: (status: { id: number; label: string; isComplete: boolean }) => Promise<any>;
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
    title: string; 
    projectId: number; 
    description?: string; 
    assigneeId?: number; 
    statusId?: number 
  }) => Promise<any>;
  addPrerequisite: (taskId: number, prerequisiteTaskId: number, prerequisiteType: string) => Promise<any>;
  updatePrerequisite: (taskId: number, prerequisiteTaskId: number, prerequisiteType: string) => Promise<any>;
  deletePrerequisite: (taskId: number, prerequisiteTaskId: number) => Promise<any>;
}

declare global {
  interface Window {
    database: DatabaseAPI;
    projects: ProjectsAPI;
    people: PeopleAPI;
    types: TypesAPI;
    statuses: StatusesAPI;
    tasks: TasksAPI;
  }
}
