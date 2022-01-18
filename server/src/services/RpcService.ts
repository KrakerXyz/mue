import { Connection, MongoQuery, QueryRecord } from '../../../core/models/index.js';
import type { RpcService as RpcServiceInterface } from '../../../core/RpcService.js';
import { getConnection, WorkspaceServices } from './index.js';

export class RpcService implements RpcServiceInterface {
   private readonly verbose = true;

   public constructor(private readonly _services: WorkspaceServices) {}

   public async *configConnectionList(): AsyncGenerator<Connection> {
      this.debug('Getting connection list');
      const connections = await this._services.config.connections.list();
      if (!connections) {
         return;
      }
      for (const c of connections) {
         yield c;
      }
   }

   public async *mongoQuery(q: MongoQuery): AsyncGenerator<QueryRecord> {
      try {
      this.debug('Getting query connection');
      const connections = await this._services.config.connections.list();
      const connection = connections?.find((c) => c.name === q.connection);
      if (!connection) {
         throw new Error(`Connection for ${q.connection} not found`);
      }
      const client = await getConnection(connection.connectionString);
      const db = client.db(q.database);
      const col = db.collection(q.collection);
      const command = col[q.command].bind(col);
      this.debug('Getting cursor');
      const cursor = command(q.query as any);

      this.debug('Starting cursor iteration');
      for await (const d of cursor) {
         if (cursor.closed) {
            this.debug('Cursor closed, breaking out of iterator');
            break;
         }

         yield d;
      }
      this.debug('Cursor finished');
      } finally {
         this.debug('Cursor finally');
      }
   }

   private debug(msg: string) {
      if (!this.verbose) {
         return;
      }
      console.debug(msg);
   }
}
