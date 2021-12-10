import { CommandClientMessage, CommandServerMessage } from './commands';
import { Subscription, SubscriptionClientMessage, SubscriptionServerMessage } from './subscriptions';

export function isSubscriptionClientMessage(msg: SubscriptionClientMessage | CommandClientMessage): msg is SubscriptionClientMessage {
   return msg.data.name.startsWith('subscription');
}

export function isSubscriptionServerMessage(msg: CommandServerMessage | SubscriptionServerMessage): msg is CommandServerMessage {
   return msg.name.startsWith('subscription');
}

export function isCommandClientMessage(msg: SubscriptionClientMessage | CommandClientMessage): msg is CommandClientMessage {
   return msg.data.name.startsWith('command');
}

export function isCommandServerMessage(msg: CommandServerMessage | SubscriptionServerMessage): msg is CommandServerMessage {
   return msg.name.startsWith('command');
}