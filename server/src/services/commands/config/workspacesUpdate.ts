import { WorkspacesUpdateCommand } from '../../../../../core/commands/configCommands.js';
import { Handler } from '../index.js';

export const workspacesUpdate: Handler<WorkspacesUpdateCommand> = (cmd, services) => {
   return services.config.workspaces.update(cmd.workspaces);
};
