
import type { AbstractCursor, Db, ListDatabasesResult as mListDatabasesResult } from 'mongodb';

export interface ClientMessage {
   id: string;
   data: Command;
}

export type Command = MongoCommand;

export type MongoCommand = ListDatabasesCommand | ListCollectionsCommand;

export type ListDatabasesCommand = {
   command: 'mongo.server.listDatabases'
}

export type ListCollectionsCommand = {
   command: 'mongo.database.listCollections',
   connectionName: string;
   databaseName: string;
}

export interface ServerMessage<TCommand extends Command | unknown = unknown> {
   /** Unique id for this result */
   id: string;
   /** The id of the command that this result is a response to */
   replyTo: string;
   data: CommandResultData<TCommand>;
}

export type CommandResultData<TCommand extends Command | unknown> =
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