import { Config, Db, Cache } from '../persistence/index.js';
import { commandEvents } from './commands/commandEvents.js';

export class WorkspaceServices {
   private static readonly _db: Db = new Db();
   private static readonly _cacheDb = new Db('cache');
   private static readonly _events = commandEvents;

   public get config(): Config {
      return new Config(WorkspaceServices._db);
   }

   public get cache(): Cache {
      return new Cache(WorkspaceServices._cacheDb);
   }

   public get commandEvents() {
      return WorkspaceServices._events;
   }
}
