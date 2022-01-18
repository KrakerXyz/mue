import { Connection } from "./models";
import type { QueryRecord, MongoQuery } from "./models/MongoQuery";

export interface RpcService {
  configConnectionList(): AsyncGenerator<Connection>;
  mongoQuery(query: MongoQuery): AsyncGenerator<QueryRecord>;
}
