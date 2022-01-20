import { Connection } from "./models";
import type { QueryRecord, MongoQuery } from "./models/MongoQuery";

export type Subscription = () => void;

export interface RpcService {
  configConnectionList(callback: (connection: Connection) => void): Subscription ;
  mongoQuery(query: MongoQuery): AsyncGenerator<QueryRecord>;
}