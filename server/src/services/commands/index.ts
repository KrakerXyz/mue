import { Command } from '@core/commands';
import { CommandResultData } from '@core/commands/mongo';
import { WorkspaceServices } from '..';
import { listCollectionsHandler, listDatabasesHandler } from './mongo';

export type Handler<T extends Command = Command> = (cmd: T, services: WorkspaceServices) => Promise<CommandResultData<T>>

type CommandKeys = Command['name'];

export const commandHandlers: Record<CommandKeys, Handler<any>> = {
   'mongo.database.listCollections': listCollectionsHandler,
   'mongo.server.listDatabases': listDatabasesHandler
};