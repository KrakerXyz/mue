
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

export type MongoSubscription = DatabasesListSubscription | CollectionsListSubscription;

export type MongoSubscriptionDataType<TSubscription extends MongoSubscription> =
   TSubscription extends DatabasesListSubscription
   ? DatabaseListData
   : TSubscription extends CollectionsListSubscription
   ? CollectionListData
   : never;