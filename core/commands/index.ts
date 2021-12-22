import { ConfigCommand } from './configCommands';
export * from './configCommands';
import { SubscriptionCommand } from './SubscriptionCommands';
export * from './SubscriptionCommands';

export type Command = ConfigCommand | SubscriptionCommand;

export interface CommandClientMessage<TData extends Command = Command> {
   id: string;
   data: TData;
}

export type CommandServerMessage<_ extends Command = Command> = {
   /** Unique id for this message */
   id: string;
   /** id from the subscription client message */
   replyTo: string;
   /** the name of the command that was executed */
   name: `command.${string}`;
   ok: boolean;
}