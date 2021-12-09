
import type { AbstractCursor, Db, ListDatabasesResult as mListDatabasesResult } from 'mongodb';

export type MongoCommand = ListDatabasesCommand | ListCollectionsCommand;

export type ListDatabasesCommand = {
   name: 'mongo.server.listDatabases',
   /** When given, only databases within the named connections are returned. When omitted, databases for all known connections are returned */
   connections?: string[]
}

export type ListCollectionsCommand = {
   name: 'mongo.database.listCollections',
   connectionName: string;
   databaseName: string;
}

export interface ServerMessage<TCommand extends MongoCommand | unknown = unknown> {
   /** Unique id for this result */
   id: string;
   /** The id of the command that this result is a response to */
   replyTo: string;
   data: CommandResultData<TCommand>;
}

export type CommandResultData<TCommand extends MongoCommand | unknown> =
   TCommand extends ListDatabasesCommand
   ? ListDatabasesResult
   : TCommand extends ListCollectionsCommand
   ? ListCollectionsResult
   : TCommand extends unknown
   ? unknown
   : never;

export type ListDatabasesResult = { connectionName: string, databases: mListDatabasesResult['databases'] }[];

type CursorType<T> = T extends AbstractCursor<infer I> ? I : never;

export type ListCollectionsResult = CursorType<ReturnType<Db['listCollections']>>[];