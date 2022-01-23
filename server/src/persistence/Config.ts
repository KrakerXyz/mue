import { Db, DbNamespace } from './Db';
import { Workspace, Connection, Widget } from '../../../core/index.js';

export class Config {
   private readonly _ns: DbNamespace;
   private readonly _nsWorkspaces: DbNamespace;
   private readonly _nsWidget: DbNamespace;

   public constructor(readonly db: Db) {
      this._ns = db.createNamespace('config');
      this._nsWorkspaces = this._ns.createNamespace('workspaces');
      this._nsWidget = this._nsWorkspaces.createNamespace('widget');
   }

   public readonly connections = {
      list: () => {
         return this._ns.get('connections') as Promise<Connection[] | null>;
      },
      update: (connections: Connection[]) => {
         return this._ns.put('connections', connections);
      },
   };

   public readonly workspaces = {
      list: () => {
         return this._nsWorkspaces.get('') as Promise<Workspace[] | null>;
      },
      update: (workspaces: Workspace[]) => {
         return this._nsWorkspaces.put('', workspaces);
      },

      widget: {
         list: () => {
            const iter: AsyncGenerator<Widget> = this._nsWidget.iterator();
            return iter;
         },
         get: (id: string) => {
            return this._nsWidget.delete(id);
         },
         update: (widget: Widget) => {
            return this._nsWidget.put(widget.id, widget);
         },
         delete: (id: string) => {
            return this._nsWidget.delete(id);
         },
      },

      // state: {
      //    get: (id: string) => {
      //       return this._nsWorkspaces.createNamespace('state').get(id) as Promise<WorkspaceState | null>;
      //    },
      //    update: (id: string, workspaceState: WorkspaceState) => {
      //       return this._nsWorkspaces.createNamespace('state').put(id, workspaceState);
      //    },
      // },
   };
}
