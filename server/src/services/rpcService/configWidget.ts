import { WorkspaceServices } from '..';
import ev from 'eventemitter3';
import { ListItem, ListItemType, Subscription, Widget } from '../../../../core/index.js';

export function useConfigWidgetServices(services: WorkspaceServices, debug: (msg: string) => void) {
   const workspaceWidgetUpdated = new ev.EventEmitter<'workspace-widget-updated', ListItem<Widget>>();

   return {
      configWidgetList(workspaceId: string, callback: (widget: ListItem<Widget>) => void): Subscription {
         debug('Starting workspaceWidgetList');
         let closed = false;
         (async () => {
            const widgets = services.config.workspaces.widget.list();
            if (closed) {
               return;
            }

            let hadOne = false;
            for await (const w of widgets) {
               if (w.workspaceId !== workspaceId) {
                  continue;
               }
               callback({ type: ListItemType.Initial, item: w });
               hadOne = true;
            }

            if (!hadOne) {
               callback({ type: ListItemType.InitialEmpty });
               return;
            }
         })();

         const onUpdate = (c: ListItem<Widget>) => {
            if (c.type === ListItemType.InitialEmpty) {
               return;
            }
            if (c.item.workspaceId !== workspaceId) {
               return;
            }
            debug('Got workspaceWidgetList update');
            callback(c);
         };

         workspaceWidgetUpdated.on('workspace-widget-updated', onUpdate);

         return {
            unsubscribe: () => {
               debug('Closing workspaceWidgetList');
               closed = true;
               workspaceWidgetUpdated.off('workspace-widget-updated', onUpdate);
            },
         };
      },

      async configWidgetPut(widget: Widget): Promise<void> {
         debug(`Update widget ${widget.id}`);
         await services.config.workspaces.widget.update(widget);
         workspaceWidgetUpdated.emit('workspace-widget-updated', { type: ListItemType.Update, item: widget });
      },

      async configWidgetDelete(widget: Widget): Promise<void> {
         debug(`Deleting widget ${widget.id}`);
         await services.config.workspaces.widget.delete(widget.id);
         workspaceWidgetUpdated.emit('workspace-widget-updated', { type: ListItemType.Delete, item: widget });
      },
   };
}
