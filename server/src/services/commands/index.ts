import { Command } from '@core/commands';
import { WorkspaceServices } from '..';
import * as config from './config';

export * from './commandEvents';

export type Handler<T extends Command = Command> = (cmd: T, services: WorkspaceServices) => Promise<void>

type SubscriptionNames = Command['name'];

export const commandHandlers: Record<SubscriptionNames, Handler<any>> = {
   'command.config.connections.update': config.connectionsUpdateHandler,
   'command.config.workspaces.update': config.workspacesUpdate,
   'command.config.workspaces.state.update': config.workspaceStateUpdateHandler,
   'command.config.favorites.update': config.favoritesUpdateHandler,
   'command.subscription.unsubscribe': () => Promise.resolve(), //This is handled by the websocket manager
   'command.subscription.nextPage': () => Promise.resolve() //This is handled by the websocket manager
};