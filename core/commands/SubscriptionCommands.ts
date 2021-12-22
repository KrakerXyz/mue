
export type UnsubscribeSubscriptionCommand = {
   name: 'command.subscription.unsubscribe';
   id: string;
}

export type NextPageCommand = {
   name: 'command.subscription.nextPage';
   id: string;
}

export type SubscriptionCommand = UnsubscribeSubscriptionCommand | NextPageCommand;