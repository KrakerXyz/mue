
import { Collection } from '../models';
import type { Document, ListDatabasesResult as mListDatabasesResult } from 'mongodb';
export { Document } from 'mongodb';

export type CollectionsListSubscription = {
   name: 'subscription.mongo.database.collections.list',
   connection: string;
   database: string;
}

export type CollectionListData = { connection: string, database: string, collections: Collection[] };

export type MongoSubscription = CollectionsListSubscription;

export type MongoSubscriptionDataType<TSubscription extends MongoSubscription> =
   TSubscription extends CollectionsListSubscription
   ? CollectionListData
   : never;