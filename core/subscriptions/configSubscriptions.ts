import { Connection, WorkspaceState } from '../models';


export type ConnectionsListSubscription = {
   name: 'subscription.config.connections.list'
}
export type ConnectionListData = { connections: Connection[] };

export type WorkspaceStateSubscription = {
   name: 'subscription.config.workspace.state'
}
export type WorkspaceStateData = WorkspaceState;

export type ConfigSubscription = ConnectionsListSubscription | WorkspaceStateSubscription;

export type ConfigSubscriptionDataType<TSubscription extends ConfigSubscription> =
   TSubscription extends ConnectionsListSubscription
   ? ConnectionListData
   : TSubscription extends WorkspaceStateSubscription
   ? WorkspaceStateData
   : never;