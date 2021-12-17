import { ConnectionsUpdateCommand } from '@core/commands/configCommands';
import { Handler } from '..';

export const connectionsUpdateHandler: Handler<ConnectionsUpdateCommand> = (cmd, services) => {
   return services.config.connections.update(cmd.connections);
};