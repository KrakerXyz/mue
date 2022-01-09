
import type { Document as QueryDocument } from 'mongodb';
export type { Document as QueryDocument } from 'mongodb';

export interface MongoQuery<TCommand extends 'find' | 'aggregate' = 'find' | 'aggregate'> {
   connection: string;
   database: string;
   collection: string;
   command: TCommand
   query: TCommand extends 'find' ? QueryDocument : QueryDocument[]
}

export type QueryRecord = Record<string, any>;