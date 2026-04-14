import { getDatabase } from '../database';
import { Status } from '../../shared/types';

export class StatusRepository {
  async getAll(): Promise<Status[]> {
    const db = getDatabase();
    return await db.all('SELECT * FROM Status ORDER BY Id ASC');
  }

  async create(status: { label: string; isNew: boolean; isComplete: boolean }) {
    const db = getDatabase();
    return await db.run(
      'INSERT INTO Status (Label, IsNew, IsComplete) VALUES (?, ?, ?)',
      [status.label, status.isNew ? 1 : 0, status.isComplete ? 1 : 0]
    );
  }

  async update(status: { id: number; label: string; isNew: boolean; isComplete: boolean }) {
    const db = getDatabase();
    return await db.run(
      'UPDATE Status SET Label = ?, IsNew = ?, IsComplete = ? WHERE Id = ?',
      [status.label, status.isNew ? 1 : 0, status.isComplete ? 1 : 0, status.id]
    );
  }

  async delete(id: number) {
    const db = getDatabase();
    return await db.run('DELETE FROM Status WHERE Id = ?', [id]);
  }
}

export const statusRepository = new StatusRepository();
