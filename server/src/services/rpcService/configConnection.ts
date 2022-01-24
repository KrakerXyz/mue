import { WorkspaceServices } from '..';
import ev from 'eventemitter3';
import { Connection, ListItem, ListItemType, Subscription } from '../../../../core/index.js';

export function useConfigConnectionServices(services: WorkspaceServices, debug: (msg: string) => void) {
   const connectionUpdated = new ev.EventEmitter<'connection-updated', ListItem<Connection>>();
   return {
      configConnectionList(callback: (connection: ListItem<Connection>) => void): Subscription {
         debug('Starting connectionList');
         let closed = false;
         (async () => {
            const connections = await services.config.connections.list();
            if (closed) {
               return;
            }

            if (!(connections?.length ?? 0)) {
               callback({ type: ListItemType.InitialEmpty });
               return;
            }

            connections?.forEach((c) => callback({ type: ListItemType.Initial, item: c }));
         })();

         const onUpdate = (c: ListItem<Connection>) => {
            debug('Got connectionList update');
            callback(c);
         };

         connectionUpdated.on('connection-updated', onUpdate);

         return {
            unsubscribe: () => {
               debug('Closing connectionList');
               closed = true;

               connectionUpdated.off('connection-updated', onUpdate);
            },
         };
      },

      async configConnectionPut(connection: Connection): Promise<void> {
         const connections = (await services.config.connections.list()) ?? [];
         const existingIndex = connections?.findIndex((c) => c.name === connection.name);
         if (existingIndex === -1) {
            connections.push(connection);
         }
         {
            connections[existingIndex] = connection;
         }
         services.cache.delete(`databaseList-${connection.name}`);
         await services.config.connections.update(connections);

         connectionUpdated.emit('connection-updated', { type: ListItemType.Update, item: connection });
      },
      async configConnectionDelete(connection: Connection): Promise<void> {
         const connections = (await services.config.connections.list()) ?? [];
         const existingIndex = connections?.findIndex((c) => c.name === connection.name);
         if (existingIndex === -1) {
            throw new Error('Connection not found');
         }
         connections.splice(existingIndex, 1);
         services.cache.delete(`databaseList-${connection.name}`);
         await services.config.connections.update(connections);

         connectionUpdated.emit('connection-updated', { type: ListItemType.Delete, item: connection });
      },
   };
}
