import { getConnection } from '@/services';
import { CommandResultData, ListDatabasesCommand } from '@core/commands/mongo';
import { Handler } from '..';

export const listDatabasesHandler: Handler<ListDatabasesCommand> = async (cmd, services) => {
   const connections = await services.config.connections.list();

   const filteredConnections = cmd.connections?.length ? connections.filter(c => cmd.connections?.includes(c.name)) : connections;

   const loadersProms = filteredConnections.map(con => {
      return {
         name: con.name,
         databases: getConnection(con.connectionString).then(c => {
            const admin = c.db().admin();
            return admin.listDatabases().then(r => r.databases);
         })
      };
   });

   const dbResults: CommandResultData<ListDatabasesCommand> = [];

   for (const loader of loadersProms) {
      dbResults.push({
         connectionName: loader.name,
         databases: await loader.databases
      });
   }

   return dbResults;
};