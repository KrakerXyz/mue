import { getConnection } from '@/services';
import { ListCollectionsCommand } from '@core/commands/mongo';
import { Handler } from '..';

export const listCollectionsHandler: Handler<ListCollectionsCommand> = async (cmd) => {
   const client = await getConnection(cmd.connectionName);
   const db = client.db(cmd.databaseName);
   const results = await db.listCollections().toArray();
   return results;
};