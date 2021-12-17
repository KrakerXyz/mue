import { Db, DbNamespace } from './Db';

export class Cache {

   private readonly _ns: DbNamespace;

   public constructor(readonly db: Db) {
      this._ns = db.createNamespace('cache');
   }

   public get<T>(name: string) {
      return this._ns.get(name) as Promise<T | null>;
   }

   public update(name: string, data: any) {
      return this._ns.put(name, data);
   }


}
