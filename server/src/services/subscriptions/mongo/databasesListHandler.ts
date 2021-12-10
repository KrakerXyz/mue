import { getConnection } from '../..';
import { DatabasesListSubscription, SubscriptionDataType } from '@core/subscriptions';
import Observable from 'zen-observable';
import { Handler } from '..';

export const databasesListHandler: Handler<DatabasesListSubscription> = (cmd) => {

   return new Observable<SubscriptionDataType<DatabasesListSubscription>>(sub => {

      getConnection(cmd.name).then(c => {
         c.db().admin().listDatabases().then(l => {
            const dbs = l.databases;

            const data: SubscriptionDataType<DatabasesListSubscription> = {
               connection: cmd.connection,
               databases: dbs
            };

            sub.next(data);
         });
      });

      return () => {
         //
      };

   });
};