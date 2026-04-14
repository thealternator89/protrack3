import { getDatabase } from '../database';
import { Person } from '../../shared/types';

export class PersonRepository {
  async getAll(): Promise<Person[]> {
    const db = getDatabase();
    return await db.all('SELECT * FROM Person ORDER BY Name ASC');
  }

  async create(person: { name: string; email: string; color?: string }) {
    const db = getDatabase();
    return await db.run(
      'INSERT INTO Person (Name, Email, Color) VALUES (?, ?, ?)',
      [person.name, person.email, person.color || null]
    );
  }

  async update(person: { id: number; name: string; email: string; color?: string }) {
    const db = getDatabase();
    return await db.run(
      'UPDATE Person SET Name = ?, Email = ?, Color = ? WHERE Id = ?',
      [person.name, person.email, person.color || null, person.id]
    );
  }

  async delete(id: number) {
    const db = getDatabase();
    return await db.run('DELETE FROM Person WHERE Id = ?', [id]);
  }
}

export const personRepository = new PersonRepository();
