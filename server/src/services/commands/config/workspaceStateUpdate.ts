import { WorkspaceStateUpdateCommand } from '../../../../../core/commands/configCommands.js';
import { Handler } from '../index.js';

export const workspaceStateUpdateHandler: Handler<WorkspaceStateUpdateCommand> = (cmd, services) => {
   return services.config.workspaces.state.update(cmd.workspaceId, cmd.state);
};
