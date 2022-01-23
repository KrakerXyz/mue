import { spawn } from 'child_process';
import ev from 'eventemitter3';
import { mkdir } from 'fs/promises';
import path from 'path';
const __dirname = path.resolve();
import {
   Collection,
   Connection,
   Database,
   MongoQuery,
   QueryRecord,
   Widget,
   Workspace,
   ListItem,
   ListItemType,
   RpcService as RpcServiceInterface,
   Subscription,
   DatabaseCopyConfig,
   DatabaseCopyStatus,
} from '../../../core/index.js';
import { getMongoClient, WorkspaceServices } from './index.js';

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

         if (!(connections?.length ?? 0)) {
            callback({ type: ListItemType.InitialEmpty });
            return;
         }

         connections?.forEach((c) => callback({ type: ListItemType.Initial, item: c }));
      })();

      const onUpdate = (c: ListItem<Connection>) => {
         this.debug('Got connectionList update');
         callback(c);
      };

      this._connectionUpdated.on('connection-updated', onUpdate);

      return {
         unsubscribe: () => {
            this.debug('Closing connectionList');
            closed = true;
            this._connectionUpdated.off('connection-updated', onUpdate);
         },
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
      this._services.cache.delete(`databaseList-${connection.name}`);
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
      this._services.cache.delete(`databaseList-${connection.name}`);
      await this._services.config.connections.update(connections);
      this._connectionUpdated.emit('connection-updated', { type: ListItemType.Delete, item: connection });
   }

   private readonly _workspaceUpdated = new ev.EventEmitter<'workspace-updated', ListItem<Workspace>>();
   public configWorkspaceList(callback: (workspace: ListItem<Workspace>) => void): Subscription {
      this.debug('Starting workspaceList');
      let closed = false;
      (async () => {
         const workspaces = await this._services.config.workspaces.list();
         if (closed) {
            return;
         }

         if (!(workspaces?.length ?? 0)) {
            callback({ type: ListItemType.InitialEmpty });
            return;
         }

         workspaces?.forEach((c) => callback({ type: ListItemType.Initial, item: c }));
      })();

      const onUpdate = (c: ListItem<Workspace>) => {
         this.debug('Got workspaceList update');
         callback(c);
      };

      this._workspaceUpdated.on('workspace-updated', onUpdate);

      return {
         unsubscribe: () => {
            this.debug('Closing workspaceList');
            closed = true;
            this._workspaceUpdated.off('workspace-updated', onUpdate);
         },
      };
   }

   public async configWorkspacePut(workspace: Workspace): Promise<void> {
      const workspaces = (await this._services.config.workspaces.list()) ?? [];
      const existingIndex = workspaces?.findIndex((c) => c.id === workspace.id);
      if (existingIndex === -1) {
         workspaces.push(workspace);
      }
      {
         workspaces[existingIndex] = workspace;
      }
      await this._services.config.workspaces.update(workspaces);
      this._workspaceUpdated.emit('workspace-updated', { type: ListItemType.Update, item: workspace });
   }

   public async configWorkspaceDelete(workspace: Workspace): Promise<void> {
      const workspaces = (await this._services.config.workspaces.list()) ?? [];
      const existingIndex = workspaces?.findIndex((c) => c.id === workspace.id);
      if (existingIndex === -1) {
         throw new Error('Workspace not found');
      }
      workspaces.splice(existingIndex, 1);

      const wsWidgets: Widget[] = [];
      const widgets = this._services.config.workspaces.widget.list();
      for await (const w of widgets) {
         if (w.workspaceId === workspace.id) {
            wsWidgets.push(w);
         }
      }
      wsWidgets.forEach((w) => this._services.config.workspaces.widget.delete(w.id));

      await this._services.config.workspaces.update(workspaces);
      this._workspaceUpdated.emit('workspace-updated', { type: ListItemType.Delete, item: workspace });
   }

   private readonly _workspaceWidgetUpdated = new ev.EventEmitter<'workspace-widget-updated', ListItem<Widget>>();
   public configWorkspaceWidgetList(workspaceId: string, callback: (widget: ListItem<Widget>) => void): Subscription {
      this.debug('Starting workspaceWidgetList');
      let closed = false;
      (async () => {
         const widgets = this._services.config.workspaces.widget.list();
         if (closed) {
            return;
         }

         let hadOne = false;
         for await (const w of widgets) {
            if (w.workspaceId !== workspaceId) {
               continue;
            }
            callback({ type: ListItemType.Initial, item: w });
            hadOne = true;
         }

         if (!hadOne) {
            callback({ type: ListItemType.InitialEmpty });
            return;
         }
      })();

      const onUpdate = (c: ListItem<Widget>) => {
         if (c.type === ListItemType.InitialEmpty) {
            return;
         }
         if (c.item.workspaceId !== workspaceId) {
            return;
         }
         this.debug('Got workspaceWidgetList update');
         callback(c);
      };

      this._workspaceWidgetUpdated.on('workspace-widget-updated', onUpdate);

      return {
         unsubscribe: () => {
            this.debug('Closing workspaceWidgetList');
            closed = true;
            this._workspaceWidgetUpdated.off('workspace-widget-updated', onUpdate);
         },
      };
   }

   public async configWorkspaceWidgetPut(widget: Widget): Promise<void> {
      this.debug(`Update widget ${widget.id}`);
      await this._services.config.workspaces.widget.update(widget);
      this._workspaceWidgetUpdated.emit('workspace-widget-updated', { type: ListItemType.Update, item: widget });
   }

   public async configWorkspaceWidgetDelete(widget: Widget): Promise<void> {
      this.debug(`Deleting widget ${widget.id}`);
      await this._services.config.workspaces.widget.delete(widget.id);
      this._workspaceWidgetUpdated.emit('workspace-widget-updated', { type: ListItemType.Delete, item: widget });
   }

   private readonly _databaseUpdated = new ev.EventEmitter<'database-updated', ListItem<Database>>();
   public mongoDatabaseList(connection: string, callback: (database: ListItem<Database>) => void): Subscription {
      this.debug('Starting databaseList');
      let closed = false;

      (async () => {
         let realSent = false;
         const cacheKey = `databaseList-${connection}`;
         this._services.cache.get<Database[]>(cacheKey).then((x) => {
            if (!x || realSent || closed) {
               return;
            }

            x.forEach((d) => callback({ type: ListItemType.Cache, item: d }));
         });

         const connections = await this._services.config.connections.list();
         const con = connections?.find((x) => x.name === connection);
         if (!con) {
            throw new Error(`Connection ${connection} not found`);
         }
         if (closed) {
            return;
         }
         const mClient = await getMongoClient(con.connectionString);
         if (closed) {
            return;
         }
         const list = await mClient.db().admin().listDatabases();
         if (closed) {
            return;
         }
         const dbs = list.databases.map((x) => {
            const d: Database = {
               connection,
               name: x.name,
            };
            return d;
         });
         this._services.cache.update(cacheKey, dbs);

         if (!dbs.length) {
            callback({ type: ListItemType.InitialEmpty });
         } else {
            dbs.forEach((d) => callback({ type: ListItemType.Initial, item: d }));
         }

         realSent = true;
      })();

      const onUpdate = (c: ListItem<Database>) => {
         this.debug('Got databaseList update');
         callback(c);
      };

      this._databaseUpdated.on('database-updated', onUpdate);

      return {
         unsubscribe: () => {
            this.debug('Closing databaseList');
            closed = true;
            this._databaseUpdated.off('database-updated', onUpdate);
         },
      };
   }

   public async mongoDatabaseDelete(database: Database): Promise<void> {
      this.debug(`Dropping db ${database.name} from ${database.connection}`);
      const connections = await this._services.config.connections.list();
      const con = connections?.find((x) => x.name === database.connection);
      if (!con) {
         throw new Error(`Connection ${database.connection} not found`);
      }

      const client = await getMongoClient(con.connectionString);

      const db = client.db(database.name);
      const dropped = await db.dropDatabase();

      if (!dropped) {
         throw new Error(`Could not drop db ${database.name}`);
      } else {
         this._services.cache.delete(`databaseList-${database.connection}`);
         this._databaseUpdated.emit('database-updated', { type: ListItemType.Delete, item: database });
      }
   }

   public mongoCollectionList(connection: string, database: string, callback: (database: ListItem<Collection>) => void): Subscription {
      this.debug('Starting collectionList');
      let closed = false;

      (async () => {
         let realSent = false;
         const cacheKey = `collectionList-${connection}-${database}`;
         this._services.cache.get<Collection[]>(cacheKey).then((x) => {
            if (!x || realSent || closed) {
               return;
            }

            x.forEach((d) => callback({ type: ListItemType.Cache, item: d }));
         });

         const connections = await this._services.config.connections.list();
         const con = connections?.find((x) => x.name === connection);
         if (!con) {
            throw new Error(`Connection ${connection} not found`);
         }
         if (closed) {
            return;
         }
         const mClient = await getMongoClient(con.connectionString);
         if (closed) {
            return;
         }

         const db = mClient.db(database);
         const list = db.listCollections();
         if (closed) {
            return;
         }

         const cols: Collection[] = [];
         for await (const dbCol of list) {
            const col: Collection = {
               connection,
               database,
               name: dbCol.name,
            };
            cols.push(col);
            callback({ type: ListItemType.Initial, item: col });
         }

         if (!cols.length) {
            callback({ type: ListItemType.InitialEmpty });
         }

         this._services.cache.update(cacheKey, cols);

         realSent = true;
      })();

      return {
         unsubscribe: () => {
            this.debug('Closing collectionList');
            closed = true;
         },
      };
   }

   public mongoDatabaseCopy(config: DatabaseCopyConfig, statusCallback: (status: DatabaseCopyStatus) => void): Subscription {
      (async () => {
         this.debug(`Starting db copy from ${config.fromDatabase} -> ${config.toDatabase}`);
         const connections = await this._services.config.connections.list();
         const fromCon = connections?.find((c) => c.name === config.fromConnection);
         if (!fromCon) {
            throw new Error(`Connection ${config.fromConnection} does not exist`);
         }
         const toCon = connections?.find((c) => c.name === config.toConnection);
         if (!toCon) {
            throw new Error(`Connection ${config.toConnection} does not exist`);
         }

         const today = new Date();
         const todayString = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;

         const localDbName = `${config.fromDatabase}${todayString}`;

         const dir = `${__dirname}\\db-backup\\${config.fromConnection}`;
         await mkdir(dir, { recursive: true });
         const mongodump = `${__dirname}\\db-backup\\mongodump`;
         const dumpArgs = [`/uri:${fromCon.connectionString}`, `/db:${config.fromDatabase}`, '/gzip', `/archive:${dir}\\${localDbName}`];

         this.debug(`Starting ${config.fromDatabase} dump`);
         statusCallback({ status: 'Starting dump' });

         await new Promise<void>((r) => {
            const proc = spawn(mongodump, dumpArgs);
            proc.stdout.on('data', (d) => {
               statusCallback({ status: d.toString() });
            });

            proc.stderr.on('data', (er) => {
               statusCallback({ status: er.toString() });
            });

            proc.on('close', () => {
               statusCallback({ status: 'Dump done' });
               r();
            });
         });

         this.debug(`Dump finished, starting restore for ${config.toDatabase}`);

         const mongorestore = `${__dirname}\\db-backup\\mongorestore`;
         const restoreArgs = [
            '/drop',
            '/gzip',
            `/archive:${dir}\\${localDbName}`,
            `/nsFrom:${config.fromDatabase}`,
            `/nsTo:${config.toDatabase}`,
            `/uri:${toCon.connectionString}`,
         ];

         statusCallback({ status: 'Starting restore' });

         await new Promise<void>((r) => {
            const proc = spawn(mongorestore, restoreArgs);
            proc.stdout.on('data', (d) => {
               statusCallback({ status: d.toString() });
            });

            proc.stderr.on('data', (er) => {
               statusCallback({ status: er.toString() });
            });

            proc.on('close', () => {
               statusCallback({ status: 'Restore done' });
               r();
            });
         });

         this.debug(`Restore for ${config.toDatabase} finished`);

         const database: Database = {
            connection: config.toConnection,
            name: config.toDatabase,
         };
         this._services.cache.delete(`databaseList-${config.toConnection}`);
         this._databaseUpdated.emit('database-updated', { type: ListItemType.Update, item: database });
      })();

      return {
         unsubscribe: () => {
            /** */
         },
      };
   }

   public async *mongoQuery(q: MongoQuery): AsyncGenerator<QueryRecord> {
      try {
         this.debug('Getting query connection');
         const connections = await this._services.config.connections.list();
         const connection = connections?.find((c) => c.name === q.connection);
         if (!connection) {
            throw new Error(`Connection for ${q.connection} not found`);
         }
         const client = await getMongoClient(connection.connectionString);
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
