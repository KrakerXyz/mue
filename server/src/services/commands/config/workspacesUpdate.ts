import { WorkspacesUpdateCommand } from '@core/commands/configCommands';
import { Handler } from '..';

export const workspacesUpdate: Handler<WorkspacesUpdateCommand> = (cmd, services) => {
   return services.config.workspaces.update(cmd.workspaces);
};