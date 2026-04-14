import { ipcMain, shell } from 'electron';

export function registerExternalHandlers() {
  ipcMain.handle('open-external', async (event, url) => {
    return await shell.openExternal(url);
  });
}
