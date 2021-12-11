import { MongoSubscription, MongoSubscriptionDataType } from './mongoSubscriptions';
export * from './mongoSubscriptions';
import { ConfigSubscription, ConfigSubscriptionDataType } from './configSubscriptions';
export * from './configSubscriptions';

export type Subscription = MongoSubscription | ConfigSubscription;

export interface SubscriptionClientMessage<TData extends Subscription = Subscription> {
   id: string;
   data: TData;
}

export type SubscriptionDataType<TSubscription extends Subscription> =
   TSubscription extends MongoSubscription
   ? MongoSubscriptionDataType<TSubscription>
   : TSubscription extends ConfigSubscription
   ? ConfigSubscriptionDataType<TSubscription>
   : never;


export type SubscriptionServerMessage<TSubscription extends Subscription = Subscription> = {
   /** Unique id for this message */
   id: string;
   /** id from the subscription client message */
   replyTo: string;
   /** the name of the command that was executed */
   name: `subscription.${string}`;
   data: SubscriptionDataType<TSubscription>;
}