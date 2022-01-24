import { mkdirSync } from 'fs';
import level from 'level';
import path from 'path';
const __dirname = path.resolve();

const instances = new Map<string, level.LevelDB>();

export class Db {
   private readonly _level: level.LevelDB;

   public constructor(public readonly name: string = 'default') {
      const levelPath = path.join(__dirname, `data/.level/${name}`);
      mkdirSync(levelPath, { recursive: true });
      console.log(`Opening leveldb from ${levelPath}`);

      let db = instances.get(name);
      if (!db) {
         db = level(levelPath);
         if (name === 'cache') {
            db.clear();
         }
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
      return this._level
         .get(key)
         .then((v) => JSON.parse(v))
         .catch(() => null);
   }

   public delete(key: string): Promise<void> {
      return this._level.del(key);
   }

   public async *iterator(prefix?: string): AsyncGenerator<any> {
      const lte = prefix ? prefix + '~' : undefined;
      const iter = this._level.iterator({
         gte: prefix,
         lte,
      }) as any;

      for await (const [_key, value] of iter) {
         const obj = JSON.parse(value);
         yield obj;
      }
   }
}

export class DbNamespace<T = any> {
   public constructor(public readonly name: string, private readonly _parent: Db | DbNamespace) {
      if (name.includes('|')) {
         throw new Error('Namespace cannot include "|"');
      }
   }

   public createNamespace<T = any>(name: string): DbNamespace {
      return new DbNamespace<T>(name, this);
   }

   public get fullName(): string {
      if (this._parent instanceof Db) {
         return this.name;
      }
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

   public delete(key: string): Promise<void> {
      const fullKey = `${this.name}|${key}`;
      return this._parent.delete(fullKey);
   }

   public iterator(prefix?: string): AsyncGenerator<T> {
      const fullKey = `${this.name}|${prefix ?? ''}`;
      return this._parent.iterator(fullKey);
   }
}
