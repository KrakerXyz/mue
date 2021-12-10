import { Config, Db } from '../persistence';

export class WorkspaceServices {

   private readonly _db: Db;

   public constructor(public readonly id: string) {
      this._db = new Db(id);
   }

   public get config(): Config {
      return new Config(this._db);
   }
}