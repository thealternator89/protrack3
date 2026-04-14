import { ipcMain } from 'electron';
import { taskRepository } from '../repositories/TaskRepository';
import { azureDevOpsService } from '../services/AzureDevOpsService';
import { descriptionService } from '../services/DescriptionService';

export function registerTaskHandlers() {
  ipcMain.handle('get-task', async (event, id) => {
    const result = await taskRepository.get(id);
    if (result && result.task && result.task.Description) {
      result.task.Description = await descriptionService.processDescription(result.task.Description);
    }
    return result;
  });

  ipcMain.handle('get-project-tasks', async (event, projectId) => {
    return await taskRepository.getByProject(projectId);
  });

  ipcMain.handle('create-task', async (event, task) => {
    return await taskRepository.create(task);
  });

  ipcMain.handle('update-task', async (event, task) => {
    return await taskRepository.update(task);
  });

  ipcMain.handle('add-prerequisite', async (event, { taskId, prerequisiteTaskId, type }) => {
    return await taskRepository.addPrerequisite(taskId, prerequisiteTaskId, type);
  });

  ipcMain.handle('update-prerequisite', async (event, { taskId, prerequisiteTaskId, type }) => {
    return await taskRepository.updatePrerequisite(taskId, prerequisiteTaskId, type);
  });

  ipcMain.handle('delete-prerequisite', async (event, { taskId, prerequisiteTaskId }) => {
    return await taskRepository.deletePrerequisite(taskId, prerequisiteTaskId);
  });

  ipcMain.handle('update-task-orders', async (event, updates) => {
    for (const update of updates) {
      await taskRepository.updateSortOrder(update.id, update.sortOrder);
    }
  });

  ipcMain.handle('import-tasks-from-source', async (event, projectId, taskSourceId, workItemIdsString) => {
    return await azureDevOpsService.importTasks(projectId, taskSourceId, workItemIdsString);
  });

  ipcMain.handle('find-task-by-display-id', async (event, { input, currentProjectId }) => {
    const parts = input.split('-');
    
    if (parts.length === 2) {
      const [prefix, displayId] = parts;
      return await taskRepository.findByDisplayId(prefix, Number(displayId));
    } else {
      return await taskRepository.findByProjectIdAndDisplayId(currentProjectId, Number(input));
    }
  });
}
