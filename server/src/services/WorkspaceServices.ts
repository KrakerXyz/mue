import { Config, Db, Cache } from '../persistence';

export class WorkspaceServices {

   private static _db: Db;

   public constructor() {
      if (!WorkspaceServices._db) { WorkspaceServices._db = new Db(); }
   }

   public get config(): Config {
      return new Config(WorkspaceServices._db);
   }

   public get cache(): Cache {
      return new Cache(WorkspaceServices._db);
   }

}