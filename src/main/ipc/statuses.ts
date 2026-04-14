import { ipcMain } from 'electron';
import { statusRepository } from '../repositories/StatusRepository';

export function registerStatusHandlers() {
  ipcMain.handle('get-statuses', async () => {
    return await statusRepository.getAll();
  });

  ipcMain.handle('create-status', async (event, status) => {
    return await statusRepository.create(status);
  });

  ipcMain.handle('update-status', async (event, status) => {
    return await statusRepository.update(status);
  });

  ipcMain.handle('delete-status', async (event, id) => {
    return await statusRepository.delete(id);
  });
}
