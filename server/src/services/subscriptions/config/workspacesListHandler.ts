import { WorkspacesUpdateCommand } from '../../../../../core/commands/index.js';
import { WorkspacesListData, WorkspacesListSubscription } from '../../../../../core/subscriptions/index.js';
import Observable from 'zen-observable';
import { OnceHandler } from '../index.js';

export const workspacesListHandler: OnceHandler<WorkspacesListSubscription> = (_, services) => {
   return new Observable<WorkspacesListData>((sub) => {
      let disposed = false;
      services.config.workspaces.list().then((x) => {
         if (disposed) {
            return;
         }

         if (!x) {
            sub.next({
               workspaces: [],
            });
            return;
         }

         sub.next({ workspaces: x });
      });

      const onUpdate = (data: WorkspacesUpdateCommand) => {
         if (disposed) {
            return;
         }
         sub.next({ workspaces: data.workspaces });
      };
      services.commandEvents.addListener('command.config.workspaces.update', onUpdate);

      return () => {
         sub.complete();
         disposed = true;
         services.commandEvents.removeListener('command.config.workspaces.update', onUpdate);
      };
   });
};
