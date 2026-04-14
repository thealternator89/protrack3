import { getDatabase } from '../database';
import { Task, TaskPrerequisite } from '../../shared/types';

export class TaskRepository {
  async get(id: number): Promise<{ 
    task: Task; 
    prerequisites: TaskPrerequisite[]; 
    dependedOnBy: TaskPrerequisite[]; 
  } | null> {
    const db = getDatabase();
    const task = await db.get(`
      SELECT t.*, p.Name as AssigneeName, s.Label as StatusLabel, s.IsComplete, pt.Title as ParentTitle
      FROM Task t
      LEFT JOIN Person p ON t.AssigneeId = p.Id
      LEFT JOIN Status s ON t.StatusId = s.Id
      LEFT JOIN Task pt ON t.ParentId = pt.Id
      WHERE t.Id = ?
    `, [id]);

    if (!task) return null;

    const prerequisites = await db.all(`
      SELECT tp.*, t.Title as PrerequisiteTaskTitle, s.IsComplete as PrerequisiteIsComplete
      FROM TaskPrerequisite tp
      JOIN Task t ON tp.PrerequisiteTaskId = t.Id
      LEFT JOIN Status s ON t.StatusId = s.Id
      WHERE tp.TaskId = ?
    `, [id]);

    const dependedOnBy = await db.all(`
      SELECT tp.*, t.Title as DependentTaskTitle, s.IsComplete as DependentIsComplete
      FROM TaskPrerequisite tp
      JOIN Task t ON tp.TaskId = t.Id
      LEFT JOIN Status s ON t.StatusId = s.Id
      WHERE tp.PrerequisiteTaskId = ?
    `, [id]);

    return { task, prerequisites, dependedOnBy };
  }

  async getByProject(projectId: number): Promise<{ tasks: Task[]; prerequisites: TaskPrerequisite[] }> {
    const db = getDatabase();
    const tasks = await db.all(`
      SELECT t.*, p.Name as AssigneeName, s.Label as StatusLabel, s.IsComplete, pt.Title as ParentTitle
      FROM Task t
      LEFT JOIN Person p ON t.AssigneeId = p.Id
      LEFT JOIN Status s ON t.StatusId = s.Id
      LEFT JOIN Task pt ON t.ParentId = pt.Id
      WHERE t.ProjectId = ?
      ORDER BY t.SortOrder ASC, t.DisplayId ASC
    `, [projectId]);

    const prerequisites = await db.all(`
      SELECT tp.*, 
             pt.Title as PrerequisiteTaskTitle, 
             ps.IsComplete as PrerequisiteIsComplete,
             dt.Title as DependentTaskTitle,
             ds.IsComplete as DependentIsComplete
      FROM TaskPrerequisite tp
      JOIN Task pt ON tp.PrerequisiteTaskId = pt.Id
      JOIN Task dt ON tp.TaskId = dt.Id
      LEFT JOIN Status ps ON pt.StatusId = ps.Id
      LEFT JOIN Status ds ON dt.StatusId = ds.Id
      WHERE pt.ProjectId = ? OR dt.ProjectId = ?
    `, [projectId, projectId]);

    return { tasks, prerequisites };
  }

  async create(task: { 
    displayId: number;
    title: string; 
    projectId: number; 
    sortOrder: number;
    description?: string; 
    assigneeId?: number; 
    statusId?: number;
    parentId?: number;
    remoteTaskId?: number;
  }) {
    const db = getDatabase();
    return await db.run(
      'INSERT INTO Task (DisplayId, Title, ProjectId, SortOrder, Description, AssigneeId, StatusId, ParentId, RemoteTaskId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        task.displayId,
        task.title,
        task.projectId,
        task.sortOrder,
        task.description || null,
        task.assigneeId || null,
        task.statusId || null,
        task.parentId || null,
        task.remoteTaskId || null
      ]
    );
  }

  async update(task: {
    id: number;
    title: string;
    description?: string;
    assigneeId?: number;
    statusId?: number;
    parentId?: number;
    remoteTaskId?: number;
  }) {
    const db = getDatabase();
    return await db.run(
      'UPDATE Task SET Title = ?, Description = ?, AssigneeId = ?, StatusId = ?, ParentId = ?, RemoteTaskId = ? WHERE Id = ?',
      [
        task.title,
        task.description || null,
        task.assigneeId || null,
        task.statusId || null,
        task.parentId || null,
        task.remoteTaskId || null,
        task.id
      ]
    );
  }

  async addPrerequisite(taskId: number, prerequisiteTaskId: number, type: string) {
    const db = getDatabase();
    return await db.run(
      'INSERT INTO TaskPrerequisite (TaskId, PrerequisiteTaskId, Type) VALUES (?, ?, ?)',
      [taskId, prerequisiteTaskId, type]
    );
  }

  async updatePrerequisite(taskId: number, prerequisiteTaskId: number, type: string) {
    const db = getDatabase();
    return await db.run(
      'UPDATE TaskPrerequisite SET Type = ? WHERE TaskId = ? AND PrerequisiteTaskId = ?',
      [type, taskId, prerequisiteTaskId]
    );
  }

  async deletePrerequisite(taskId: number, prerequisiteTaskId: number) {
    const db = getDatabase();
    return await db.run(
      'DELETE FROM TaskPrerequisite WHERE TaskId = ? AND PrerequisiteTaskId = ?',
      [taskId, prerequisiteTaskId]
    );
  }

  async updateSortOrder(id: number, sortOrder: number) {
    const db = getDatabase();
    return await db.run('UPDATE Task SET SortOrder = ? WHERE Id = ?', [sortOrder, id]);
  }

  async findByDisplayId(prefix: string, displayId: number) {
    const db = getDatabase();
    return await db.get(`
      SELECT t.Id 
      FROM Task t 
      JOIN Project p ON t.ProjectId = p.Id 
      WHERE p.Prefix = ? AND t.DisplayId = ?
    `, [prefix.toUpperCase(), displayId]);
  }

  async findByProjectIdAndDisplayId(projectId: number, displayId: number) {
    const db = getDatabase();
    return await db.get(`
      SELECT Id FROM Task WHERE ProjectId = ? AND DisplayId = ?
    `, [projectId, displayId]);
  }

  async getTaskCountInProject(projectId: number): Promise<number> {
    const db = getDatabase();
    const result = await db.get('SELECT COUNT(*) as count FROM Task WHERE ProjectId = ?', [projectId]);
    return result.count;
  }

  async getMaxDisplayId(projectId: number): Promise<number> {
    const db = getDatabase();
    const result = await db.get('SELECT MAX(DisplayId) as maxId FROM Task WHERE ProjectId = ?', [projectId]);
    return result?.maxId || 0;
  }

  async getMaxSortOrder(projectId: number): Promise<number> {
    const db = getDatabase();
    const result = await db.get('SELECT MAX(SortOrder) as maxSort FROM Task WHERE ProjectId = ?', [projectId]);
    return result?.maxSort || 0;
  }
}

export const taskRepository = new TaskRepository();
