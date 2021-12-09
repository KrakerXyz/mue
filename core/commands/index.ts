import { CommandResultData, MongoCommand } from './mongo';
export * from './mongo';

export type Command = MongoCommand;

export interface ClientMessage {
   id: string;
   data: Command;
}

export interface ServerMessage<TCommand extends Command | unknown = unknown> {
   /** Unique id for this result */
   id: string;
   /** The id of the command that this result is a response to */
   replyTo: string;
   data: CommandResultData<TCommand>;
}