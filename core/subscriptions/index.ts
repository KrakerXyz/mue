import { MongoSubscription, SubscriptionDataType } from './mongoSubscriptions';
export * from './mongoSubscriptions';

export type Subscription = MongoSubscription;

export interface SubscriptionClientMessage<TData extends Subscription = Subscription> {
   id: string;
   data: TData;
}

export type SubscriptionServerMessage<TSubscription extends Subscription = Subscription> = {
   /** Unique id for this message */
   id: string;
   /** id from the subscription client message */
   replyTo: string;
   /** the name of the command that was executed */
   name: `subscription.${string}`;
   data: SubscriptionDataType<TSubscription>;
}