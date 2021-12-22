import { QuerySubscription, SubscriptionDataType, Document, QueryData } from '@core/subscriptions';
import { AggregationCursor, FindCursor } from 'mongodb';
import Observable from 'zen-observable';
import { PagedHandler } from '..';
import { getConnection, WorkspaceServices } from '../..';

export const queryHandler: PagedHandler<QuerySubscription> = (cmd, services, nextPage) => {
   return new Observable<SubscriptionDataType<QuerySubscription>>(sub => {
      let resultCursor: FindCursor | AggregationCursor | null = null;
      let nextPageSubscription: ZenObservable.Subscription | null = null;
      let page = 0;

      const runNextPage = () => {
         if (!resultCursor || resultCursor.closed) { return; }
         loadPage(resultCursor, cmd.connection, page, sub);
         page++;
      };

      (async () => {
         resultCursor = await getCursor(services, cmd);

         nextPageSubscription = nextPage.subscribe(() => {
            runNextPage();
         });

         runNextPage();
      })();


      return () => {
         resultCursor?.close();
         nextPageSubscription?.unsubscribe();
      };
   });
};

async function getCursor(services: WorkspaceServices, cmd: QuerySubscription) {
   const connections = await services.config.connections.list();
   const connection = connections?.find(c => c.name === cmd.connection);
   if (!connection) { throw new Error(`Connection for ${cmd.connection} not found`); }
   const client = await getConnection(connection.connectionString);
   const db = client.db(cmd.database);
   const col = db.collection(cmd.collection);
   const command = col[cmd.command].bind(col);
   const cursor = command(cmd.query as any);
   return cursor;
}



async function loadPage(resultCursor: FindCursor | AggregationCursor, connection: string, page: number, sub: ZenObservable.SubscriptionObserver<QueryData>) {

   let results: Document[] = [];
   let resultsSent = 0;

   for await (const d of resultCursor) {

      if (resultCursor.closed) {
         return;
      }

      results.push(d);

      if (resultsSent + results.length === 50) {

         sub.next({
            connection: connection,
            results: results,
            page,
            pageComplete: true,
            queryComplete: false
         });

         return;
      }


      if (results.length === 5) {
         sub.next({
            connection: connection,
            results,
            page,
            pageComplete: false,
            queryComplete: false
         });
         resultsSent += results.length;
         results = [];
      }
   }

   //If we got here, then we're out of results

   if (!resultCursor.closed) {
      sub.next({
         connection: connection,
         results: results,
         page,
         pageComplete: true,
         queryComplete: true
      });
   }

}