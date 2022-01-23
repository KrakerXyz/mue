import {
  Collection,
  Connection,
  Database,
  DatabaseCopyConfig,
  DatabaseCopyStatus,
  Widget,
  Workspace,
} from "./models";
import type { QueryRecord, MongoQuery } from "./models/MongoQuery";

export type Subscription = { unsubscribe: () => void };
export enum ListItemType {
  Cache,
  Initial,
  InitialEmpty,
  Update,
  Delete,
}
export type ListItem<T> =
  | { type: Omit<ListItemType, ListItemType.InitialEmpty>; item: T }
  | { type: ListItemType.InitialEmpty };

export interface RpcService {
  configConnectionList(
    callback: (connection: ListItem<Connection>) => void
  ): Subscription;
  configConnectionPut(connection: Connection): Promise<void>;
  configConnectionDelete(connection: Connection): Promise<void>;

  configWorkspaceList(
    callback: (workspace: ListItem<Workspace>) => void
  ): Subscription;
  configWorkspacePut(workspace: Workspace): Promise<void>;
  configWorkspaceDelete(workspace: Workspace): Promise<void>;

  configWorkspaceWidgetList(
    workspaceId: string,
    callback: (widget: ListItem<Widget>) => void
  ): Subscription;
  configWorkspaceWidgetPut(widget: Widget): Promise<void>;
  configWorkspaceWidgetDelete(widget: Widget): Promise<void>;

  mongoDatabaseList(
    connection: string,
    callback: (database: ListItem<Database>) => void
  ): Subscription;
  mongoDatabaseDelete(database: Database): Promise<void>;
  mongoDatabaseCopy(
    config: DatabaseCopyConfig,
    statusCallback: (status: DatabaseCopyStatus) => void
  ): Subscription;

  mongoCollectionList(
    connection: string,
    database: string,
    callback: (collection: ListItem<Collection>) => void
  ): Subscription;

  mongoQuery(query: MongoQuery): AsyncGenerator<QueryRecord>;
}
