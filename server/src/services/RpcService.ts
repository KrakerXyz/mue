import { MongoQuery, QueryRecord } from '../../../core/models/index.js';
import type { RpcService as RpcServiceInterface } from '../../../core/RpcService.js';
import { getConnection, WorkspaceServices } from './index.js';

export class RpcService implements RpcServiceInterface {
   public constructor(private readonly _services: WorkspaceServices) {}

   private async *query(q: MongoQuery): AsyncGenerator<QueryRecord> {
      console.debug('Getting query connection');
      const connections = await this._services.config.connections.list();
      const connection = connections?.find((c) => c.name === q.connection);
      if (!connection) {
         throw new Error(`Connection for ${q.connection} not found`);
      }
      const client = await getConnection(connection.connectionString);
      const db = client.db(q.database);
      const col = db.collection(q.collection);
      const command = col[q.command].bind(col);
      console.debug('Getting cursor');
      const cursor = command(q.query as any);

      console.debug('Starting cursor iteration');
      for await (const d of cursor) {
         if (cursor.closed) {
            console.debug('Cursor closed, breaking out of iterator');
            break;
         }

         console.debug('yield record');
         yield d;
         console.debug('yielded record');
      }
      console.debug('Cursor finished');
   }

   public readonly mongo: RpcServiceInterface['mongo'] = {
      query: this.query.bind(this),
   };
}
