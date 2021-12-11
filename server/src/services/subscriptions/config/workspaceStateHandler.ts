import { SubscriptionDataType } from '@core/subscriptions';
import { WorkspaceStateSubscription } from '@core/subscriptions/configSubscriptions';
import Observable from 'zen-observable';
import { Handler } from '..';

export const workspaceStateHandler: Handler<WorkspaceStateSubscription> = (_, services) => {

   return new Observable<SubscriptionDataType<WorkspaceStateSubscription>>(sub => {

      services.config.workspaceState.get().then(x => {
         if (!x) { x = { widgets: [] }; }
         sub.next(x);
      });

      return () => {
         //
      };

   });

};