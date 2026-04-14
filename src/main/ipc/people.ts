import { ipcMain } from 'electron';
import { personRepository } from '../repositories/PersonRepository';

export function registerPeopleHandlers() {
  ipcMain.handle('get-people', async () => {
    return await personRepository.getAll();
  });

  ipcMain.handle('create-person', async (event, person) => {
    return await personRepository.create(person);
  });

  ipcMain.handle('update-person', async (event, person) => {
    return await personRepository.update(person);
  });

  ipcMain.handle('delete-person', async (event, id) => {
    return await personRepository.delete(id);
  });
}
