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
  Color: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | null;
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
