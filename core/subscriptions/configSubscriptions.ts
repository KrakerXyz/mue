import { Connection } from '../models';


export type ConnectionsListSubscription = {
   name: 'subscription.config.connections.list'
}

export type ConnectionListData = { connections: Connection[] };

export type ConfigSubscription = ConnectionsListSubscription;

export type ConfigSubscriptionDataType<TSubscription extends ConfigSubscription> =
   TSubscription extends ConnectionsListSubscription
   ? ConnectionListData
   : never;