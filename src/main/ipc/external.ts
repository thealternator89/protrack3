import { ipcMain, shell, app } from 'electron';

export function registerExternalHandlers() {
  ipcMain.handle('open-external', async (event, url) => {
    return await shell.openExternal(url);
  });

  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });
}
