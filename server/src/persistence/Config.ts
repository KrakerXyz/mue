import { Db, DbNamespace } from './Db';
import { Connection } from './model/Connection';

export class Config {

   private readonly _ns: DbNamespace;

   public constructor(readonly db: Db) {
      this._ns = db.createNamespace('config');
   }

   public readonly connections = {
      list: () => {
         return this._ns.get('connections') as Promise<Connection[]>;
      }
   };

}
