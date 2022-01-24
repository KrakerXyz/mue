import { getMongoClient, WorkspaceServices } from '../index.js';
import { Collection, ListItem, ListItemType, Subscription } from '../../../../core/index.js';

export function useMongoCollectionServices(services: WorkspaceServices, debug: (msg: string) => void) {
   return {
      mongoCollectionList(connection: string, database: string, callback: (database: ListItem<Collection>) => void): Subscription {
         debug('Starting collectionList');
         let closed = false;

         (async () => {
            let realSent = false;
            const cacheKey = `collectionList-${connection}-${database}`;
            services.cache.get<Collection[]>(cacheKey).then((x) => {
               if (!x || realSent || closed) {
                  return;
               }

               x.forEach((d) => callback({ type: ListItemType.Cache, item: d }));
            });

            const connections = await services.config.connections.list();
            const con = connections?.find((x) => x.name === connection);
            if (!con) {
               throw new Error(`Connection ${connection} not found`);
            }
            if (closed) {
               return;
            }
            const mClient = await getMongoClient(con.connectionString);
            if (closed) {
               return;
            }

            const db = mClient.db(database);
            const list = db.listCollections();
            if (closed) {
               return;
            }

            const cols: Collection[] = [];
            for await (const dbCol of list) {
               const col: Collection = {
                  connection,
                  database,
                  name: dbCol.name,
               };
               cols.push(col);
               callback({ type: ListItemType.Initial, item: col });
            }

            if (!cols.length) {
               callback({ type: ListItemType.InitialEmpty });
            }

            services.cache.update(cacheKey, cols);

            realSent = true;
         })();

         return {
            unsubscribe: () => {
               debug('Closing collectionList');
               closed = true;
            },
         };
      },
   };
}
