import { ipcMain } from 'electron';
import { taskSourceRepository } from '../repositories/TaskSourceRepository';

export function registerTaskSourceHandlers() {
  ipcMain.handle('get-task-sources', async () => {
    return await taskSourceRepository.getAll();
  });

  ipcMain.handle('create-task-source', async (event, source) => {
    return await taskSourceRepository.create(source);
  });

  ipcMain.handle('update-task-source', async (event, source) => {
    return await taskSourceRepository.update(source);
  });

  ipcMain.handle('delete-task-source', async (event, id) => {
    return await taskSourceRepository.delete(id);
  });

  // StatusMap IPC Handlers
  ipcMain.handle('get-status-maps', async (event, taskSourceId) => {
    return await taskSourceRepository.getStatusMaps(taskSourceId);
  });

  ipcMain.handle('update-status-maps', async (event, taskSourceId, maps) => {
    return await taskSourceRepository.updateStatusMaps(taskSourceId, maps);
  });
}
