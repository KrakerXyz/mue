import { Connection, Workspace, WorkspaceState } from '../models';

export type ConnectionsUpdateCommand = {
   name: 'command.config.connections.update';
   connections: Connection[];
}

export type WorkspacesUpdateCommand = {
   name: 'command.config.workspaces.update';
   workspaces: Workspace[];
}

export type WorkspaceStateUpdateCommand = {
   name: 'command.config.workspaces.state.update';
   workspaceId: string;
   state: WorkspaceState
}

export type ConfigCommand = ConnectionsUpdateCommand | WorkspaceStateUpdateCommand | WorkspacesUpdateCommand;