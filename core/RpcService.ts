import type { QueryRecord, MongoQuery } from './models/MongoQuery';

export interface RpcService {
   mongo: {
      query(query: MongoQuery): AsyncGenerator<QueryRecord>
   }
}