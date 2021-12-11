import { SubscriptionDataType } from '@core/subscriptions';
import { ConnectionsListSubscription } from '@core/subscriptions/configSubscriptions';
import Observable from 'zen-observable';
import { Handler } from '..';

export const connectionsListHandler: Handler<ConnectionsListSubscription> = (_, services) => {

   return new Observable<SubscriptionDataType<ConnectionsListSubscription>>(sub => {

      services.config.connections.list().then(connections => {
         sub.next({ connections: connections ?? [] });
      });

      return () => {
         //
      };

   });

};