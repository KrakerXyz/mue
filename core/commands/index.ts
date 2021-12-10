import { ConfigCommand } from './configCommands';

export type Command = ConfigCommand;

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