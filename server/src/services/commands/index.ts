import { Command } from '@core/commands';
import { WorkspaceServices } from '..';
import * as config from './config';

export type Handler<T extends Command = Command> = (cmd: T, services: WorkspaceServices) => Promise<void>

type SubscriptionNames = Command['name'];

export const commandHandlers: Record<SubscriptionNames, Handler<any>> = {
   'command.config.connections.update': config.connectionsUpdateHandler,
};