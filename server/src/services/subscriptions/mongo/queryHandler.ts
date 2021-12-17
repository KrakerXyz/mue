import { QuerySubscription, SubscriptionDataType, Document } from '@core/subscriptions';
import Observable from 'zen-observable';
import { Handler } from '..';
import { getConnection } from '../..';

export const queryHandler: Handler<QuerySubscription> = (cmd, services) => {
   return new Observable<SubscriptionDataType<QuerySubscription>>(sub => {

      let disposed = false;

      (async () => {
         const connections = await services.config.connections.list();
         const connection = connections?.find(c => c.name === cmd.connection);
         if (!connection) { throw new Error(`Connection for ${cmd.connection} not found`); }
         const client = await getConnection(connection.connectionString);

         const db = client.db(cmd.database);
         const col = db.collection(cmd.collection);
         const command = col[cmd.command].bind(col);

         let resultOuter: any;
         try {
            const result = command(cmd.query as any);
            resultOuter = result;

            let results: Document[] = [];
            let resultsSent = 0;

            await result.forEach(d => {

               if (resultsSent >= 50) {
                  result.close();
                  return;
               }

               if (disposed) {
                  result.close();
                  return;
               }
               results.push(d);

               if (results.length === 5) {
                  sub.next({
                     connection: cmd.connection,
                     results,
                     complete: false
                  });
                  resultsSent += results.length;
                  results = [];
               }
            });

            if (!disposed) {
               sub.next({
                  connection: cmd.connection,
                  results: results,
                  complete: true
               });
            }

         } catch (e) {
            console.error('Error running query', e);
         }

         resultOuter?.close();
      })();

      return () => {
         disposed = true;
      };
   });
};