import { WorkspaceStateUpdateCommand } from '@core/commands/configCommands';
import { Handler } from '..';

export const workspaceStateUpdateHandler: Handler<WorkspaceStateUpdateCommand> = (cmd, services) => {
   return services.config.workspaces.state.update(cmd.workspaceId, cmd.state);
};