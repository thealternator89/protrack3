import { getDatabase } from '../database';
import { TaskSource, StatusMap } from '../../shared/types';

export class TaskSourceRepository {
  async getAll(): Promise<TaskSource[]> {
    const db = getDatabase();
    return await db.all('SELECT * FROM TaskSource ORDER BY Id ASC');
  }

  async getById(id: number): Promise<TaskSource | undefined> {
    const db = getDatabase();
    return await db.get('SELECT * FROM TaskSource WHERE Id = ?', [id]);
  }

  async create(source: { name: string; type: string; config: string }) {
    const db = getDatabase();
    return await db.run(
      'INSERT INTO TaskSource (Name, Type, Config) VALUES (?, ?, ?)',
      [source.name, source.type, source.config]
    );
  }

  async update(source: { id: number; name: string; type: string; config: string }) {
    const db = getDatabase();
    return await db.run(
      'UPDATE TaskSource SET Name = ?, Type = ?, Config = ? WHERE Id = ?',
      [source.name, source.type, source.config, source.id]
    );
  }

  async delete(id: number) {
    const db = getDatabase();
    return await db.run('DELETE FROM TaskSource WHERE Id = ?', [id]);
  }

  // StatusMap methods
  async getStatusMaps(taskSourceId: number): Promise<StatusMap[]> {
    const db = getDatabase();
    return await db.all('SELECT * FROM StatusMap WHERE TaskSourceId = ?', [taskSourceId]);
  }

  async updateStatusMaps(taskSourceId: number, maps: { statusId: number; sourceName: string }[]) {
    const db = getDatabase();
    await db.run('BEGIN TRANSACTION');
    try {
      await db.run('DELETE FROM StatusMap WHERE TaskSourceId = ?', [taskSourceId]);
      for (const map of maps) {
        await db.run(
          'INSERT INTO StatusMap (TaskSourceId, StatusId, SourceName) VALUES (?, ?, ?)',
          [taskSourceId, map.statusId, map.sourceName]
        );
      }
      await db.run('COMMIT');
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }
}

export const taskSourceRepository = new TaskSourceRepository();
