import { Connection, Workspace, WorkspaceState } from '../models';


export type ConnectionsListSubscription = {
   name: 'subscription.config.connections.list'
}
export type ConnectionListData = { connections: Connection[] };

export type WorkspacesListSubscription = {
   name: 'subscription.config.workspaces.list';
}

export type WorkspacesListData = { workspaces: Workspace[] }

export type WorkspaceStateSubscription = {
   name: 'subscription.config.workspaces.state'
   workspaceId: string;
}
export type WorkspaceStateData = WorkspaceState;

export type ConfigSubscription = ConnectionsListSubscription | WorkspaceStateSubscription | WorkspacesListSubscription;

export type ConfigSubscriptionDataType<TSubscription extends ConfigSubscription> =
   TSubscription extends ConnectionsListSubscription
   ? ConnectionListData
   : TSubscription extends WorkspaceStateSubscription
   ? WorkspaceStateData
   : TSubscription extends WorkspacesListSubscription
   ? WorkspacesListData
   : never;