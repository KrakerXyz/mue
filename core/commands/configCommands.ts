import { Connection, Favorites, Workspace, WorkspaceState } from '../models';

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
   state: WorkspaceState;
}

export type FavoritesUpdateCommand = {
   name: 'command.config.favorites.update';
   favorites: Favorites;
}

export type ConfigCommand = ConnectionsUpdateCommand | WorkspaceStateUpdateCommand | WorkspacesUpdateCommand | FavoritesUpdateCommand;