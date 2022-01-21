import { Connection, Database } from "./models";
import type { QueryRecord, MongoQuery } from "./models/MongoQuery";

export type Subscription = () => void;
export enum ListItemType {
  Cache,
  Initial,
  Update,
  Delete,
}
export type ListItem<T> = { type: ListItemType; item: T };

export interface RpcService {
  configConnectionList(
    callback: (connection: ListItem<Connection>) => void
  ): Subscription;
  configConnectionPut(connection: Connection): Promise<void>;
  configConnectionDelete(connection: Connection): Promise<void>;
  mongoDatabaseList(
    connection: string,
    callback: (database: ListItem<Database>) => void
  ): Subscription;
  mongoQuery(query: MongoQuery): AsyncGenerator<QueryRecord>;
}
