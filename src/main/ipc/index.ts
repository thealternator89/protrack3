import { registerProjectHandlers } from './projects';
import { registerPeopleHandlers } from './people';
import { registerStatusHandlers } from './statuses';
import { registerTaskHandlers } from './tasks';
import { registerTaskSourceHandlers } from './taskSources';
import { registerExternalHandlers } from './external';
import { registerDatabaseHandlers } from './database';

export function registerIpcHandlers() {
  registerProjectHandlers();
  registerPeopleHandlers();
  registerStatusHandlers();
  registerTaskHandlers();
  registerTaskSourceHandlers();
  registerExternalHandlers();
  registerDatabaseHandlers();
}
