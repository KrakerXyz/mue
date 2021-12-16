import { Db, DbNamespace } from './Db';
import { Connection } from '@core/models/Connection';
import { Workspace, WorkspaceState } from '@core/models';

export class Config {

   private readonly _ns: DbNamespace;
   private readonly _nsWorkspaces: DbNamespace;

   public constructor(readonly db: Db) {
      this._ns = db.createNamespace('config');
      this._nsWorkspaces = this._ns.createNamespace('workspaces');
   }

   public readonly connections = {
      list: () => {
         return this._ns.get('connections') as Promise<Connection[] | null>;
      },
      update: (connections: Connection[]) => {
         return this._ns.put('connections', connections);
      }
   };

   public readonly workspaces = {

      list: () => {
         return this._nsWorkspaces.get('') as Promise<Workspace[] | null>;
      },
      update: (workspaces: Workspace[]) => {
         return this._nsWorkspaces.put('', workspaces);
      },

      state: {
         get: (id: string) => {
            return this._nsWorkspaces.createNamespace('state').get(id) as Promise<WorkspaceState | null>;
         },
         update: (id: string, workspaceState: WorkspaceState) => {
            return this._nsWorkspaces.createNamespace('state').put(id, workspaceState);
         }
      }

   };

}
