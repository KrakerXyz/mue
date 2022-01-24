import { getMongoClient, WorkspaceServices } from '../index.js';
import ev from 'eventemitter3';
import { Database, DatabaseCopyConfig, DatabaseCopyStatus, ListItem, ListItemType, Subscription } from '../../../../core/index.js';
import { mkdir } from 'fs/promises';
import { spawn } from 'child_process';
import path from 'path';
const __dirname = path.resolve();

export function useMongoDatabaseServices(services: WorkspaceServices, debug: (msg: string) => void) {
   const databaseUpdated = new ev.EventEmitter<'database-updated', ListItem<Database>>();
   return {
      mongoDatabaseList(connection: string, callback: (database: ListItem<Database>) => void): Subscription {
         debug('Starting databaseList');
         let closed = false;

         (async () => {
            let realSent = false;
            const cacheKey = `databaseList-${connection}`;
            services.cache.get<Database[]>(cacheKey).then((x) => {
               if (!x || realSent || closed) {
                  return;
               }

               x.forEach((d) => callback({ type: ListItemType.Cache, item: d }));
            });

            const connections = await services.config.connections.list();
            const con = connections?.find((x) => x.name === connection);
            if (!con) {
               throw new Error(`Connection ${connection} not found`);
            }
            if (closed) {
               return;
            }
            const mClient = await getMongoClient(con.connectionString);
            if (closed) {
               return;
            }
            const list = await mClient.db().admin().listDatabases();
            if (closed) {
               return;
            }
            const dbs = list.databases.map((x) => {
               const d: Database = {
                  connection,
                  name: x.name,
               };
               return d;
            });
            services.cache.update(cacheKey, dbs);

            if (!dbs.length) {
               callback({ type: ListItemType.InitialEmpty });
            } else {
               dbs.forEach((d) => callback({ type: ListItemType.Initial, item: d }));
            }

            realSent = true;
         })();

         const onUpdate = (c: ListItem<Database>) => {
            debug('Got databaseList update');
            callback(c);
         };

         databaseUpdated.on('database-updated', onUpdate);

         return {
            unsubscribe: () => {
               debug('Closing databaseList');
               closed = true;
               databaseUpdated.off('database-updated', onUpdate);
            },
         };
      },

      async mongoDatabaseDelete(database: Database): Promise<void> {
         debug(`Dropping db ${database.name} from ${database.connection}`);
         const connections = await services.config.connections.list();
         const con = connections?.find((x) => x.name === database.connection);
         if (!con) {
            throw new Error(`Connection ${database.connection} not found`);
         }

         const client = await getMongoClient(con.connectionString);

         const db = client.db(database.name);
         const dropped = await db.dropDatabase();

         if (!dropped) {
            throw new Error(`Could not drop db ${database.name}`);
         } else {
            services.cache.delete(`databaseList-${database.connection}`);
            databaseUpdated.emit('database-updated', { type: ListItemType.Delete, item: database });
         }
      },
      mongoDatabaseCopy(config: DatabaseCopyConfig, statusCallback: (status: DatabaseCopyStatus) => void): Subscription {
         (async () => {
            debug(`Starting db copy from ${config.fromDatabase} -> ${config.toDatabase}`);
            const connections = await services.config.connections.list();
            const fromCon = connections?.find((c) => c.name === config.fromConnection);
            if (!fromCon) {
               throw new Error(`Connection ${config.fromConnection} does not exist`);
            }
            const toCon = connections?.find((c) => c.name === config.toConnection);
            if (!toCon) {
               throw new Error(`Connection ${config.toConnection} does not exist`);
            }

            const today = new Date();
            const todayString = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;

            const localDbName = `${config.fromDatabase}${todayString}`;

            const archivePath = path.join(__dirname, 'data', 'db-backup', config.fromConnection, localDbName);
            await mkdir(archivePath, { recursive: true });
            const mongodump = path.join(__dirname, 'bin', 'mongodump');
            console.log(`Using mongodump from ${mongodump}`);
            console.log(`Saving backup to ${archivePath}`);
            const dumpArgs = [`/uri:${fromCon.connectionString}`, `/db:${config.fromDatabase}`, '/gzip', `/archive:${archivePath}`];

            debug(`Starting ${config.fromDatabase} dump`);
            statusCallback({ status: 'Starting dump' });

            await new Promise<void>((r) => {
               const proc = spawn(mongodump, dumpArgs);
               proc.stdout.on('data', (d) => {
                  statusCallback({ status: d.toString() });
               });

               proc.stderr.on('data', (er) => {
                  statusCallback({ status: er.toString() });
               });

               proc.on('close', () => {
                  statusCallback({ status: 'Dump done' });
                  r();
               });
            });

            debug(`Dump finished, starting restore to ${config.toDatabase}`);

            const mongorestore = path.join(__dirname, 'bin', 'mongorestore');
            const restoreArgs = [
               '/drop',
               '/gzip',
               `/archive:${archivePath}`,
               `/nsFrom:${config.fromDatabase}`,
               `/nsTo:${config.toDatabase}`,
               `/uri:${toCon.connectionString}`,
            ];

            statusCallback({ status: 'Starting restore' });

            await new Promise<void>((r) => {
               const proc = spawn(mongorestore, restoreArgs);
               proc.stdout.on('data', (d) => {
                  statusCallback({ status: d.toString() });
               });

               proc.stderr.on('data', (er) => {
                  statusCallback({ status: er.toString() });
               });

               proc.on('close', () => {
                  statusCallback({ status: 'Restore done' });
                  r();
               });
            });

            debug(`Restore for ${config.toDatabase} finished`);

            const database: Database = {
               connection: config.toConnection,
               name: config.toDatabase,
            };
            services.cache.delete(`databaseList-${config.toConnection}`);
            databaseUpdated.emit('database-updated', { type: ListItemType.Update, item: database });
         })();

         return {
            unsubscribe: () => {
               /** */
            },
         };
      },
   };
}
