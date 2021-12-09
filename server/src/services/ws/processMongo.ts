import { MongoCommand, CommandResultData, ListDatabasesCommand, ListCollectionsCommand } from '@core/ws';
import { dbs, getConnection } from '..';

export function processMongo<TCommand extends MongoCommand>(command: TCommand): Promise<CommandResultData<MongoCommand>> {
   switch (command.command) {
      case 'mongo.server.listDatabases': {
         return listDatabases();
      }
      case 'mongo.database.listCollections': {
         return listCollections(command);
      }
   }
}

async function listDatabases(): Promise<CommandResultData<ListDatabasesCommand>> {
   const loadersProms = Object.getOwnPropertyNames(dbs).map(name => {
      return {
         name,
         databases: getConnection(name).then(c => {
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
}

async function listCollections(command: ListCollectionsCommand): Promise<CommandResultData<ListCollectionsCommand>> {
   const client = await getConnection(command.connectionName);
   const db = client.db(command.databaseName);
   const results = await db.listCollections().toArray();
   return results;
}