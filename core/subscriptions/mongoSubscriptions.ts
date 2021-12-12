
import { Collection } from '../models';
import type { Document, ListDatabasesResult as mListDatabasesResult } from 'mongodb';
export { Document } from 'mongodb';

export type DatabasesListSubscription = {
   name: 'subscription.mongo.server.databases.list',
   connection: string;
}

export type DatabaseListData = { connection: string, databases: mListDatabasesResult['databases'] };

export type CollectionsListSubscription = {
   name: 'subscription.mongo.database.collections.list',
   connection: string;
   database: string;
}

export type CollectionListData = { connection: string, database: string, collections: Collection[] };

export type QuerySubscription<TCommand extends 'find' | 'aggregate' = 'find' | 'aggregate'> = {
   name: 'subscription.mongo.query',
   connection: string;
   database: string;
   collection: string;
   command: TCommand
   query: TCommand extends 'find' ? Document : Document[]
}

export type QueryData = {
   connection: string;
   results: Record<string, any>[];
   complete: boolean;
}

export type MongoSubscription = DatabasesListSubscription | CollectionsListSubscription | QuerySubscription;

export type MongoSubscriptionDataType<TSubscription extends MongoSubscription> =
   TSubscription extends DatabasesListSubscription
   ? DatabaseListData
   : TSubscription extends CollectionsListSubscription
   ? CollectionListData
   : TSubscription extends QuerySubscription
   ? QueryData
   : never;