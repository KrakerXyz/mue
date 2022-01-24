import { WorkspaceServices } from '..';
import ev from 'eventemitter3';
import { Workspace, ListItem, ListItemType, Subscription, Widget } from '../../../../core/index.js';

export function useConfigWorkspaceServices(services: WorkspaceServices, debug: (msg: string) => void) {
   const workspaceUpdated = new ev.EventEmitter<'workspace-updated', ListItem<Workspace>>();
   return {
      configWorkspaceList(callback: (workspace: ListItem<Workspace>) => void): Subscription {
         debug('Starting workspaceList');
         let closed = false;
         (async () => {
            const workspaces = await services.config.workspaces.list();
            if (closed) {
               return;
            }

            if (!(workspaces?.length ?? 0)) {
               callback({ type: ListItemType.InitialEmpty });
               return;
            }

            workspaces?.forEach((c) => callback({ type: ListItemType.Initial, item: c }));
         })();

         const onUpdate = (c: ListItem<Workspace>) => {
            debug('Got workspaceList update');
            callback(c);
         };

         workspaceUpdated.on('workspace-updated', onUpdate);

         return {
            unsubscribe: () => {
               debug('Closing workspaceList');
               closed = true;
               workspaceUpdated.off('workspace-updated', onUpdate);
            },
         };
      },

      async configWorkspacePut(workspace: Workspace): Promise<void> {
         const workspaces = (await services.config.workspaces.list()) ?? [];
         const existingIndex = workspaces?.findIndex((c) => c.id === workspace.id);
         if (existingIndex === -1) {
            workspaces.push(workspace);
         }
         {
            workspaces[existingIndex] = workspace;
         }
         await services.config.workspaces.update(workspaces);
         workspaceUpdated.emit('workspace-updated', { type: ListItemType.Update, item: workspace });
      },

      async configWorkspaceDelete(workspace: Workspace): Promise<void> {
         const workspaces = (await services.config.workspaces.list()) ?? [];
         const existingIndex = workspaces?.findIndex((c) => c.id === workspace.id);
         if (existingIndex === -1) {
            throw new Error('Workspace not found');
         }
         workspaces.splice(existingIndex, 1);

         const wsWidgets: Widget[] = [];
         const widgets = services.config.workspaces.widget.list();
         for await (const w of widgets) {
            if (w.workspaceId === workspace.id) {
               wsWidgets.push(w);
            }
         }
         wsWidgets.forEach((w) => services.config.workspaces.widget.delete(w.id));

         await services.config.workspaces.update(workspaces);
         workspaceUpdated.emit('workspace-updated', { type: ListItemType.Delete, item: workspace });
      },
   };
}
