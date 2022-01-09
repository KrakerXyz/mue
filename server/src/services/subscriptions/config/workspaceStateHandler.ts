import { WorkspaceStateUpdateCommand } from '../../../../../core/commands/index.js';
import { SubscriptionDataType } from '../../../../../core/subscriptions/index.js';
import { WorkspaceStateSubscription } from '../../../../../core/subscriptions/configSubscriptions.js';
import Observable from 'zen-observable';
import { OnceHandler } from '../index.js';

export const workspaceStateHandler: OnceHandler<WorkspaceStateSubscription> = (cmd, services) => {
   return new Observable<SubscriptionDataType<WorkspaceStateSubscription>>((sub) => {
      let disposed = false;
      services.config.workspaces.state.get(cmd.workspaceId).then((x) => {
         if (disposed) {
            return;
         }
         if (!x) {
            x = { widgets: [] };
         }
         sub.next(x);
      });

      const onUpdate = (data: WorkspaceStateUpdateCommand) => {
         if (disposed) {
            return;
         }
         if (data.workspaceId !== cmd.workspaceId) {
            return;
         }
         sub.next(data.state);
      };
      services.commandEvents.addListener('command.config.workspaces.state.update', onUpdate);

      return () => {
         sub.complete();
         disposed = true;
         services.commandEvents.removeListener('command.config.workspaces.state.update', onUpdate);
      };
   });
};
