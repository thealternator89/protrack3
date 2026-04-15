import * as azdev from 'azure-devops-node-api';
import * as WITInterfaces from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';
import { getDatabase } from '../database';
import { taskRepository } from '../repositories/TaskRepository';
import { taskSourceRepository } from '../repositories/TaskSourceRepository';
import { personRepository } from '../repositories/PersonRepository';
import { statusRepository } from '../repositories/StatusRepository';

export class AzureDevOpsService {
  async importTasks(projectId: number, taskSourceId: number, workItemIdsString: string) {
    const db = getDatabase();
    let connection: azdev.WebApi | undefined;

    try {
      const taskSource = await taskSourceRepository.getById(taskSourceId);
      if (!taskSource) {
        throw new Error(`TaskSource with ID ${taskSourceId} not found.`);
      }

      const config = JSON.parse(taskSource.Config);
      const { organizationUrl, pat } = config;

      if (!organizationUrl || !pat) {
        throw new Error('TaskSource configuration missing organizationUrl or pat.');
      }

      const authHandler = azdev.getPersonalAccessTokenHandler(pat);
      connection = new azdev.WebApi(organizationUrl, authHandler);
      const witApi = await connection.getWorkItemTrackingApi();

      const workItemIds = workItemIdsString.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      if (workItemIds.length === 0) {
        throw new Error('No valid work item IDs provided.');
      }

      const azDevWorkItems = await witApi.getWorkItems(workItemIds, undefined, undefined, WITInterfaces.WorkItemExpand.Relations);
      
      const statusMaps = await taskSourceRepository.getStatusMaps(taskSourceId);
      const people = await personRepository.getAll();
      const statuses = await statusRepository.getAll();

      const defaultNewStatus = statuses.find(s => s.IsNew === 1) || statuses[0];
      if (!defaultNewStatus) {
        throw new Error('No default "New" status found in the database.');
      }

      let maxDisplayId = await taskRepository.getMaxDisplayId(projectId);
      let maxSortOrder = await taskRepository.getMaxSortOrder(projectId);

      await db.run('BEGIN TRANSACTION');
      try {
        for (const wi of azDevWorkItems) {
          if (!wi.id || !wi.fields) continue;

          const title = wi.fields['System.Title'];
          const description = wi.fields['System.Description'] || null;
          const azDevStatus = wi.fields['System.State'];
          const assignedTo = wi.fields['System.AssignedTo'];
          const remoteTaskId = wi.id;

          let statusId: number | null = defaultNewStatus.Id;
          const mappedStatus = statusMaps.find(sm => sm.SourceName.toLowerCase() === azDevStatus.toLowerCase());
          if (mappedStatus) {
            statusId = mappedStatus.StatusId;
          }

          let assigneeId: number | null = null;
          if (assignedTo && (assignedTo.displayName || assignedTo.uniqueName)) {
            const assigneeName = assignedTo.displayName;
            const assigneeEmail = assignedTo.uniqueName;

            const matchedPerson = people.find(p =>
              p.Name.toLowerCase() === assigneeName.toLowerCase() ||
              (p.Email && assigneeEmail && p.Email.toLowerCase() === assigneeEmail.toLowerCase())
            );

            if (matchedPerson) {
              assigneeId = matchedPerson.Id;
            }
          }

          const existingTask = await taskRepository.findByRemoteId(projectId, remoteTaskId);
          if (existingTask) {
            await taskRepository.update({
              id: existingTask.Id,
              title,
              description: description || null,
              assigneeId,
              statusId,
              remoteTaskId,
              parentId: existingTask.ParentId,
              effort: existingTask.Effort
            });
          } else {
            maxDisplayId++;
            maxSortOrder += 10;

            await taskRepository.create({
              displayId: maxDisplayId,
              title,
              projectId,
              sortOrder: maxSortOrder,
              description: description || null,
              assigneeId,
              statusId,
              remoteTaskId
            });
          }
        }
        await db.run('COMMIT');
      } catch (innerError) {
        await db.run('ROLLBACK');
        throw innerError;
      }
    } catch (error) {
      console.error('Failed to import tasks from Azure DevOps:', error);
      throw error;
    }
  }
}

export const azureDevOpsService = new AzureDevOpsService();
