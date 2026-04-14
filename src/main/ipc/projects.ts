import { ipcMain } from 'electron';
import { projectRepository } from '../repositories/ProjectRepository';

export function registerProjectHandlers() {
  ipcMain.handle('create-project', async (event, project) => {
    return await projectRepository.create(project);
  });

  ipcMain.handle('get-project', async (event, id) => {
    return await projectRepository.get(id);
  });

  ipcMain.handle('update-project', async (event, project) => {
    return await projectRepository.update(project);
  });
}
