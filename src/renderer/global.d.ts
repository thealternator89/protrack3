export interface Project {
  Id: number;
  Title: string;
  StartDate: string | null;
  DueDate: string | null;
  OwnerId: number | null;
  TaskSourceId: number | null;
}

export interface DatabaseAPI {
  query: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
  run: (sql: string, params?: any[]) => Promise<any>;
}

export interface ProjectsAPI {
  create: (project: { title: string; startDate?: string; dueDate?: string }) => Promise<any>;
}

declare global {
  interface Window {
    database: DatabaseAPI;
    projects: ProjectsAPI;
  }
}
