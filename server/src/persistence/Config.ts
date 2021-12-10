import { Db, DbNamespace } from './Db';
import { Connection } from '@core/models/Connection';

export class Config {

   private readonly _ns: DbNamespace;

   public constructor(readonly db: Db) {
      this._ns = db.createNamespace('config');
   }

   public readonly connections = {
      list: () => {
         return this._ns.get('connections') as Promise<Connection[]>;
      },
      update: (connections: Connection[]) => {
         return this._ns.put('connections', connections);
      }
   };

}
