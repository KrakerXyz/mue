import { Subscription, SubscriptionDataType } from '../../../../core/subscriptions/index.js';
import { WorkspaceServices } from '../index.js';
import { collectionsListHandler } from './mongo/index.js';
import Observable from 'zen-observable';
import * as config from './config/index.js';

export type OnceHandler<T extends Subscription = Subscription> = (cmd: T, services: WorkspaceServices) => Observable<SubscriptionDataType<T>>;
export type PagedHandler<T extends Subscription = Subscription> = (
   cmd: T,
   services: WorkspaceServices,
   nextPage: Observable<void>
) => Observable<SubscriptionDataType<T>>;

export type Handler<T extends Subscription = Subscription> = OnceHandler<T> | PagedHandler<T>;

type SubscriptionNames = Subscription['name'];

export const subscriptionHandlers: Record<SubscriptionNames, Handler<any>> = {
   'subscription.mongo.database.collections.list': collectionsListHandler,

   'subscription.config.workspaces.state': config.workspaceStateHandler,
   'subscription.config.workspaces.list': config.workspacesListHandler,
   'subscription.config.favorites': config.favoritesHandler,
};
