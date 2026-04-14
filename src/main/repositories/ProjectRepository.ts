import { getDatabase } from '../database';
import { Project } from '../../shared/types';

export class ProjectRepository {
  async get(id: number): Promise<Project | undefined> {
    const db = getDatabase();
    return await db.get('SELECT * FROM Project WHERE Id = ?', [id]);
  }

  async getAll(): Promise<Project[]> {
    const db = getDatabase();
    return await db.all('SELECT * FROM Project ORDER BY Title ASC');
  }

  async create(project: { title: string; prefix: string; startDate?: string; dueDate?: string; ownerId?: number; taskSourceId?: number }) {
    const db = getDatabase();
    return await db.run(
      'INSERT INTO Project (Title, Prefix, StartDate, DueDate, OwnerId, TaskSourceId) VALUES (?, ?, ?, ?, ?, ?)',
      [project.title, project.prefix, project.startDate || null, project.dueDate || null, project.ownerId || null, project.taskSourceId || null]
    );
  }

  async update(project: { id: number; title: string; prefix: string; startDate?: string; dueDate?: string; ownerId?: number; taskSourceId?: number }) {
    const db = getDatabase();
    return await db.run(
      'UPDATE Project SET Title = ?, Prefix = ?, StartDate = ?, DueDate = ?, OwnerId = ?, TaskSourceId = ? WHERE Id = ?',
      [project.title, project.prefix, project.startDate || null, project.dueDate || null, project.ownerId || null, project.taskSourceId || null, project.id]
    );
  }
}

export const projectRepository = new ProjectRepository();
