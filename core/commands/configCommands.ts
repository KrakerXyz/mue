import { Connection } from '../models';

export type ConfigCommand = ConnectionsUpdateCommand

export type ConnectionsUpdateCommand = {
   name: 'command.config.connections.update',
   connections: Connection[]
}