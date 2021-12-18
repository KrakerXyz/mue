import { getConnection } from '../..';
import { DatabaseListData, DatabasesListSubscription, SubscriptionDataType } from '@core/subscriptions';
import Observable from 'zen-observable';
import { Handler } from '..';

export const databasesListHandler: Handler<DatabasesListSubscription> = (cmd, services) => {

   return new Observable<SubscriptionDataType<DatabasesListSubscription>>(sub => {
      let disposed = false;
      let realSent = false;
      const cacheKey = `${cmd.name}.${cmd.connection}`;
      services.cache.get<DatabaseListData>(cacheKey).then(x => {
         if (!x) { return; }
         if (realSent) { return; }
         if (disposed) { return; }
         sub.next(x);
      });

      services.config.connections.list().then(connections => {
         if (disposed) { return; }

         const connection = connections?.find(c => c.name === cmd.connection);
         if (!connection) { throw new Error(`Connection for ${cmd.connection} not found`); }

         getConnection(connection.connectionString).then(c => {
            if (disposed) { return; }

            c.db().admin().listDatabases().then(l => {
               if (disposed) { return; }
               const dbs = l.databases;

               const data: SubscriptionDataType<DatabasesListSubscription> = {
                  connection: cmd.connection,
                  databases: dbs
               };

               realSent = true;
               sub.next(data);
               services.cache.update(cacheKey, data);
            }).catch(e => {
               sub.error(`Error getting database list for ${cmd.connection}: ${e}`);
            });
         });

      });

      return () => {
         disposed = true;
      };

   });
};