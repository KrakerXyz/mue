import { Config, Db, Cache } from '../persistence';
import { commandEvents } from './commands/commandEvents';

export class WorkspaceServices {

   private static readonly _db: Db = new Db();
   private static readonly _events = commandEvents;

   public get config(): Config {
      return new Config(WorkspaceServices._db);
   }

   public get cache(): Cache {
      return new Cache(WorkspaceServices._db);
   }

   public get commandEvents() {
      return WorkspaceServices._events;
   }

}