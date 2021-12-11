import { Db, DbNamespace } from './Db';
import { Connection } from '@core/models/Connection';
import { WorkspaceState } from '@core/models';

export class Config {

   private readonly _ns: DbNamespace;

   public constructor(readonly db: Db) {
      this._ns = db.createNamespace('config');
   }

   public readonly connections = {
      list: () => {
         return this._ns.get('connections') as Promise<Connection[] | null>;
      },
      update: (connections: Connection[]) => {
         return this._ns.put('connections', connections);
      }
   };

   public readonly workspaceState = {
      get: () => {
         return this._ns.get('workspace-state') as Promise<WorkspaceState | null>;
      },
      update: (workspaceState: WorkspaceState) => {
         return this._ns.put('workspace-state', workspaceState);
      }
   };

}
