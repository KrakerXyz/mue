
import level from 'level';

const instances = new Map<string, level.LevelDB>();

export class Db {

   private readonly _level: level.LevelDB;

   public constructor(public readonly name: string = 'default') {
      let db = instances.get(name);
      if (!db) {
         db = level(`.level/${name}`);
         instances.set(name, db);
      }
      this._level = db;
   }

   public createNamespace<T = any>(name: string): DbNamespace {
      return new DbNamespace<T>(name, this);
   }

   public put(key: string, value: any): Promise<void> {
      return this._level.put(key, JSON.stringify(value));
   }

   public get(key: string): Promise<any | null> {
      return this._level.get(key).then(v => JSON.parse(v)).catch(() => null);
   }

}

export class DbNamespace<T = any> {
   public constructor(public readonly name: string, private readonly _parent: Db | DbNamespace) {
      if (name.includes('|')) { throw new Error('Namespace cannot include "|"'); }
   }

   public get fullName(): string {
      if (this._parent instanceof Db) { return this.name; }
      return `${this._parent.fullName}|${this.name}`;
   }

   public put(key: string, value: T): Promise<void> {
      const fullKey = `${this.name}|${key}`;
      return this._parent.put(fullKey, value);
   }

   public get(key: string): Promise<T | null> {
      const fullKey = `${this.name}|${key}`;
      return this._parent.get(fullKey);
   }
}