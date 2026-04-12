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

declare global {
  interface Window {
    database: DatabaseAPI;
    projects: ProjectsAPI;
    people: PeopleAPI;
    types: TypesAPI;
    statuses: StatusesAPI;
  }
}
