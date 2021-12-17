import { reactive, readonly } from '@vue/reactivity';
import { v4 } from 'uuid';
import { Command, CommandServerMessage, CommandClientMessage, UnsubscribeSubscriptionCommand } from '@core/commands';
import { Subscription, SubscriptionServerMessage, SubscriptionClientMessage, SubscriptionDataType } from '@core/subscriptions';
import { isCommandServerMessage } from '@core/index';
import Observable from 'zen-observable';

let ws: WebSocket | undefined;
const state = reactive({
   connected: false
});

const inflightCommands = new Map<string, { resolve: (msg: CommandServerMessage) => void | Promise<void>, reject: () => void }>();
const subscriptions = new Map<string, ZenObservable.SubscriptionObserver<SubscriptionDataType<any>>>();

const sendQueue: any[] = [];

const queueSend = (message?: SubscriptionClientMessage | CommandClientMessage) => {
   if (message) { sendQueue.push(message); }
   if (!sendQueue.length) { return; }

   if (!state.connected) { return; }

   const toSend = sendQueue.shift();
   ws?.send(JSON.stringify(toSend));

   queueSend();
};

export function useWs() {
   if (!ws) {
      const url = `ws${window.location.protocol === 'https' ? 's' : ''}://${window.location.host}/ws`;
      ws = new WebSocket(url);
      ws.addEventListener('open', () => {
         state.connected = true;
         queueSend();
      });
      ws.addEventListener('close', () => {
         state.connected = false;
      });

      ws.addEventListener('message', data => {
         const obj: CommandServerMessage | SubscriptionServerMessage = JSON.parse(data.data);
         if (isCommandServerMessage(obj)) {
            const prom = inflightCommands.get(obj.replyTo);
            if (!prom) { return; }
            prom.resolve(obj);
            inflightCommands.delete(obj.replyTo);
         } else {
            const sub = subscriptions.get(obj.replyTo);
            if (!sub) {
               console.warn(`Received ${obj.name} subscription data for a subscription that did not exist`);
               return;
            }

            sub.next(obj.data);
         }

      });
   }

   return {
      state: readonly(state),
      subscribe<TSubscription extends Subscription>(data: TSubscription): Observable<SubscriptionDataType<TSubscription>> {
         const clientMessage: SubscriptionClientMessage = {
            id: v4(),
            data
         };

         return new Observable<SubscriptionDataType<TSubscription>>(sub => {

            subscriptions.set(clientMessage.id, sub);

            queueSend(clientMessage);

            return () => {
               const unsubscribeMessage: UnsubscribeSubscriptionCommand = {
                  id: clientMessage.id,
                  name: 'command.subscription.unsubscribe'
               };
               queueSend({ id: v4(), data: unsubscribeMessage });
               subscriptions.delete(clientMessage.id);
            };
         });
      },
      command<TCommand extends Command>(data: TCommand): Promise<CommandServerMessage> {
         const clientMessage: CommandClientMessage = {
            id: v4(),
            data
         };

         return new Promise<CommandServerMessage>((resolve, reject) => {
            inflightCommands.set(clientMessage.id, { resolve, reject });
            queueSend(clientMessage);
         });
      }
   };
}
