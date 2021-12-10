
import type { AbstractCursor, Db, ListDatabasesResult as mListDatabasesResult } from 'mongodb';

export type MongoSubscription = DatabasesListSubscription | CollectionsListSubscription;

export type DatabasesListSubscription = {
   name: 'subscription.mongo.server.databases.list',
   connection: string;
}

export type CollectionsListSubscription = {
   name: 'subscription.mongo.database.collections.list',
   connection: string;
   database: string;
}

export type SubscriptionDataType<TSubscription extends MongoSubscription> =
   TSubscription extends DatabasesListSubscription
   ? DatabaseListData
   : TSubscription extends CollectionsListSubscription
   ? CollectionListData
   : never;

export type DatabaseListData = { connection: string, databases: mListDatabasesResult['databases'] };

type CursorType<T> = T extends AbstractCursor<infer I> ? I : never;
export type CollectionListData = { connection: string, database: string, collections: CursorType<ReturnType<Db['listCollections']>>[] };