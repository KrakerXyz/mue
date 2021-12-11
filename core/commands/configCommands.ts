import { Connection, WorkspaceState } from '../models';

export type ConfigCommand = ConnectionsUpdateCommand | WorkspaceStateUpdateCommand;

export type ConnectionsUpdateCommand = {
   name: 'command.config.connections.update',
   connections: Connection[]
}

export type WorkspaceStateUpdateCommand = {
   name: 'command.config.workspace.state.update',
   state: WorkspaceState
}