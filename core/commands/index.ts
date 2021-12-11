import { ConfigCommand } from './configCommands';
export * from './configCommands';
import { UnsubscribeSubscriptionCommand } from './unsubscribeSubscriptionCommand';
export * from './unsubscribeSubscriptionCommand';

export type Command = ConfigCommand | UnsubscribeSubscriptionCommand;

export interface CommandClientMessage<TData extends Command = Command> {
   id: string;
   data: TData;
}

export type CommandServerMessage<TCommand extends Command = Command> = {
   /** Unique id for this message */
   id: string;
   /** id from the subscription client message */
   replyTo: string;
   /** the name of the command that was executed */
   name: `command.${string}`;
   ok: boolean;
}