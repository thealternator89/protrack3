import { ipcMain } from 'electron';
import { getDatabase } from '../database';

export function registerDatabaseHandlers() {
  ipcMain.handle('db-query', async (event, sql, params) => {
    const db = getDatabase();
    return await db.all(sql, params);
  });

  ipcMain.handle('db-run', async (event, sql, params) => {
    const db = getDatabase();
    return await db.run(sql, params);
  });
}
