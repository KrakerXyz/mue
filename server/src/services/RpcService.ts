import ev from 'eventemitter3';
import { Connection, Database, MongoQuery, QueryRecord, Widget, Workspace } from '../../../core/models/index.js';
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

      return () => {
         this.debug('Closing workspaceList');
         closed = true;
         this._workspaceUpdated.off('workspace-updated', onUpdate);
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
      await this._services.config.workspaces.update(workspaces);
      this._workspaceUpdated.emit('workspace-updated', { type: ListItemType.Delete, item: workspace });
   }

   private readonly _workspaceWidgetUpdated = new ev.EventEmitter<'workspace-widget-updated', ListItem<Widget>>();
   public configWorkspaceWidgetList(workspaceId: string, callback: (widget: ListItem<Widget>) => void): Subscription {
      this.debug('Starting workspaceWidgetList');
      let closed = false;
      (async () => {
         const state = await this._services.config.workspaces.state.get(workspaceId);
         if (closed) {
            return;
         }

         if (!(state?.widgets?.length ?? 0)) {
            callback({ type: ListItemType.InitialEmpty });
            return;
         }

         state?.widgets.forEach((c) => callback({ type: ListItemType.Initial, item: c }));
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

      return () => {
         this.debug('Closing workspaceWidgetList');
         closed = true;
         this._workspaceWidgetUpdated.off('workspace-widget-updated', onUpdate);
      };
   }

   public async configWorkspaceWidgetPut(widget: Widget): Promise<void> {
      const state = (await this._services.config.workspaces.state.get(widget.workspaceId)) ?? { widgets: [] };
      const existingIndex = state.widgets.findIndex((c) => c.id === widget.id);
      if (existingIndex === -1) {
         state.widgets.push(widget);
      }
      {
         state.widgets[existingIndex] = widget;
      }
      await this._services.config.workspaces.state.update(widget.workspaceId, state);
      this._workspaceWidgetUpdated.emit('workspace-widget-updated', { type: ListItemType.Update, item: widget });
   }

   public async configWorkspaceWidgetDelete(widget: Widget): Promise<void> {
      const state = (await this._services.config.workspaces.state.get(widget.workspaceId)) ?? { widgets: [] };
      const existingIndex = state.widgets.findIndex((c) => c.id === widget.id);
      if (existingIndex === -1) {
         throw new Error('Widget not found');
      }
      {
         state.widgets.splice(existingIndex, 1);
      }
      await this._services.config.workspaces.state.update(widget.workspaceId, state);
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
         const mClient = await getConnection(con.connectionString);
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

      return () => {
         this.debug('Closing databaseList');
         closed = true;
         this._databaseUpdated.off('database-updated', onUpdate);
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
