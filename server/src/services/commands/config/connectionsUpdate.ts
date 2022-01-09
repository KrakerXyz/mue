import { ConnectionsUpdateCommand } from '../../../../../core/commands/configCommands.js';
import { Handler } from '../index.js';

export const connectionsUpdateHandler: Handler<ConnectionsUpdateCommand> = (cmd, services) => {
   return services.config.connections.update(cmd.connections);
};
