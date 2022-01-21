import ev from 'eventemitter3';
import { Connection, MongoQuery, QueryRecord } from '../../../core/models/index.js';
import { ListItem, ListItemType, RpcService as RpcServiceInterface, Subscription } from '../../../core/RpcService.js';
import { getConnection, WorkspaceServices } from './index.js';

export class RpcService implements RpcServiceInterface {
   private readonly verbose = true;

   public constructor(private readonly _services: WorkspaceServices) {}

   private readonly _connectionUpdated = new ev.EventEmitter<'connection-updated', ListItem<Connection>>();
   public configConnectionList(callback: (connection: ListItem<Connection>) => void): Subscription {
      this.debug('Starting connectionList');
      let closed = false;
      (async () => {
         const connections = await this._services.config.connections.list();
         if (closed) {
            return;
         }
         connections?.forEach((c) => callback({ type: ListItemType.Initial, item: c }));
      })();

      const onUpdate = (c: ListItem<Connection>) => {
         this.debug('Got connectionList update');
         callback(c);
      };

      this._connectionUpdated.on('connection-updated', onUpdate);

      return () => {
         this.debug('Closing connectionList');
         closed = true;
         this._connectionUpdated.off('connection-updated', onUpdate);
      };
   }

   public async configConnectionPut(connection: Connection): Promise<void> {
      const connections = (await this._services.config.connections.list()) ?? [];
      const existingIndex = connections?.findIndex((c) => c.name === connection.name);
      if (existingIndex === -1) {
         connections.push(connection);
      }
      {
         connections[existingIndex] = connection;
      }
      await this._services.config.connections.update(connections);
      this._connectionUpdated.emit('connection-updated', { type: ListItemType.Update, item: connection });
   }

   public async configConnectionDelete(connection: Connection): Promise<void> {
      const connections = (await this._services.config.connections.list()) ?? [];
      const existingIndex = connections?.findIndex((c) => c.name === connection.name);
      if (existingIndex === -1) {
         throw new Error('Connection not found');
      }
      connections.splice(existingIndex, 1);
      await this._services.config.connections.update(connections);
      this._connectionUpdated.emit('connection-updated', { type: ListItemType.Delete, item: connection });
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
