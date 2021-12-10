import { getConnection } from '../..';
import { CollectionsListSubscription, SubscriptionDataType } from '@core/subscriptions';
import Observable from 'zen-observable';
import { Handler } from '..';

export const collectionsListHandler: Handler<CollectionsListSubscription> = (cmd) => {

   const obs = new Observable<SubscriptionDataType<CollectionsListSubscription>>(sub => {

      (async () => {
         const client = await getConnection(cmd.connection);
         const db = client.db(cmd.database);
         const results = await db.listCollections().toArray();

         const data: SubscriptionDataType<CollectionsListSubscription> = {
            collections: results,
            connection: cmd.connection,
            database: cmd.database
         };
         sub.next(data);
      })();

      return () => {
         //
      };

   });

   return obs;
};