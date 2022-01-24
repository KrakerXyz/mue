import { Config, Db, Cache } from '../persistence/index.js';

export class WorkspaceServices {
   private static readonly _db: Db = new Db();
   private static readonly _cacheDb = new Db('cache');

   public get config(): Config {
      return new Config(WorkspaceServices._db);
   }

   public get cache(): Cache {
      return new Cache(WorkspaceServices._cacheDb);
   }
}
