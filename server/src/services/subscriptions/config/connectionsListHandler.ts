import { ConnectionsUpdateCommand } from '../../../../../core/commands/index.js';
import { SubscriptionDataType } from '../../../../../core/subscriptions/index.js';
import { ConnectionsListSubscription } from '../../../../../core/subscriptions/configSubscriptions.js';
import Observable from 'zen-observable';
import { OnceHandler } from '../index.js';

export const connectionsListHandler: OnceHandler<ConnectionsListSubscription> = (_, services) => {
   return new Observable<SubscriptionDataType<ConnectionsListSubscription>>((sub) => {
      let disposed = false;
      services.config.connections.list().then((connections) => {
         if (disposed) {
            return;
         }
         sub.next({ connections: connections ?? [] });
      });

      const onUpdate = (data: ConnectionsUpdateCommand) => {
         if (disposed) {
            return;
         }
         sub.next({ connections: data.connections });
      };
      services.commandEvents.addListener('command.config.connections.update', onUpdate);

      return () => {
         disposed = true;
         sub.complete();
         services.commandEvents.removeListener('command.config.connections.update', onUpdate);
      };
   });
};
