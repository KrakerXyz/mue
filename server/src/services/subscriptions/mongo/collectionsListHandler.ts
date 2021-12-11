import { getConnection } from '../..';
import { CollectionListData, CollectionsListSubscription, SubscriptionDataType } from '@core/subscriptions';
import Observable from 'zen-observable';
import { Handler } from '..';

export const collectionsListHandler: Handler<CollectionsListSubscription> = (cmd, services) => {

   const obs = new Observable<SubscriptionDataType<CollectionsListSubscription>>(sub => {
      let disposed = false;
      let realSent = false;
      const cacheKey = `${cmd.name}.${cmd.connection}.${cmd.database}`;
      services.cache.get<CollectionListData>(cacheKey).then(x => {
         if (!x) { return; }
         if (realSent) { return; }
         if (disposed) { return; }
         sub.next(x);
      });

      (async () => {
         const connections = await services.config.connections.list();
         if (disposed) { return; }

         const connection = connections?.find(c => c.name === cmd.connection);
         if (!connection) { throw new Error(`Connection for ${cmd.connection} not found`); }

         const client = await getConnection(connection.connectionString);
         if (disposed) { return; }

         const db = client.db(cmd.database);
         const results = await db.listCollections().toArray();
         if (disposed) { return; }

         const data: CollectionListData = {
            collections: results,
            connection: cmd.connection,
            database: cmd.database
         };
         sub.next(data);
         realSent = true;
         services.cache.update(cacheKey, data);
      })();

      return () => {
         disposed = true;
      };

   });

   return obs;
};