import { ConnectionsUpdateCommand } from '@core/commands';
import { SubscriptionDataType } from '@core/subscriptions';
import { ConnectionsListSubscription } from '@core/subscriptions/configSubscriptions';
import Observable from 'zen-observable';
import { Handler } from '..';

export const connectionsListHandler: Handler<ConnectionsListSubscription> = (_, services) => {

   return new Observable<SubscriptionDataType<ConnectionsListSubscription>>(sub => {

      services.config.connections.list().then(connections => {
         sub.next({ connections: connections ?? [] });
      });

      const onUpdate = (data: ConnectionsUpdateCommand) => {
         sub.next({ connections: data.connections });
      };
      services.commandEvents.addListener('command.config.connections.update', onUpdate);

      return () => {
         services.commandEvents.removeListener('command.config.connections.update', onUpdate);
      };

   });

};