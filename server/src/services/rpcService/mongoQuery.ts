import { getMongoClient, WorkspaceServices } from '../index.js';
import { MongoQuery, QueryRecord } from '../../../../core/index.js';

export function useMongoQueryServices(services: WorkspaceServices, debug: (msg: string) => void) {
   return {
      async *mongoQuery(q: MongoQuery): AsyncGenerator<QueryRecord> {
         try {
            debug('Getting query connection');
            const connections = await services.config.connections.list();
            const connection = connections?.find((c) => c.name === q.connection);
            if (!connection) {
               throw new Error(`Connection for ${q.connection} not found`);
            }
            const client = await getMongoClient(connection.connectionString);
            const db = client.db(q.database);
            const col = db.collection(q.collection);
            const command = col[q.command].bind(col);
            debug('Getting cursor');
            const cursor = command(q.query as any);

            debug('Starting cursor iteration');
            for await (const d of cursor) {
               if (cursor.closed) {
                  debug('Cursor closed, breaking out of iterator');
                  break;
               }

               yield d;
            }
            debug('Cursor finished');
         } finally {
            debug('Cursor finally');
         }
      },
   };
}
