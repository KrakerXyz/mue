import { Subscription, SubscriptionDataType } from '@core/subscriptions';
import { WorkspaceServices } from '..';
import { collectionsListHandler, databasesListHandler, queryHandler } from './mongo';
import Observable from 'zen-observable';
import { connectionsListHandler, workspaceStateHandler } from './config';

export type Handler<T extends Subscription = Subscription> = (cmd: T, services: WorkspaceServices) => Observable<SubscriptionDataType<T>>

type SubscriptionNames = Subscription['name'];

export const subscriptionHandlers: Record<SubscriptionNames, Handler<any>> = {
   'subscription.mongo.database.collections.list': collectionsListHandler,
   'subscription.mongo.server.databases.list': databasesListHandler,
   'subscription.mongo.query': queryHandler,

   'subscription.config.connections.list': connectionsListHandler,
   'subscription.config.workspace.state': workspaceStateHandler
};