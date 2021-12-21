import { reactive, readonly } from '@vue/reactivity';
import { v4 } from 'uuid';
import { Command, CommandServerMessage, CommandClientMessage, UnsubscribeSubscriptionCommand } from '@core/commands';
import { Subscription, SubscriptionServerMessage, SubscriptionClientMessage, SubscriptionDataType } from '@core/subscriptions';
import { isCommandServerMessage } from '@core/index';
import Observable from 'zen-observable';
import { proxy } from 'comlink';
import WsWorker from 'comlink:./ws-worker';

const state = reactive({
   connected: false
});

const inflightCommands = new Map<string, { resolve: (msg: CommandServerMessage) => void | Promise<void>, reject: () => void }>();
const subscriptions = new Map<string, ZenObservable.SubscriptionObserver<SubscriptionDataType<any>>>();

let wsWorker: ReturnType<typeof WsWorker> | null = null;

export function useWs() {
   if (!wsWorker) {

      wsWorker = WsWorker();

      wsWorker.addEventListener('message', proxy((obj: CommandServerMessage | SubscriptionServerMessage) => {
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

      }));
   }

   wsWorker.addEventListener('connected', proxy((connected: boolean) => {
      state.connected = connected;
   }));

   return {
      state: readonly(state),
      subscribe<TSubscription extends Subscription>(data: TSubscription): Observable<SubscriptionDataType<TSubscription>> {
         const clientMessage: SubscriptionClientMessage = {
            id: v4(),
            data
         };

         return new Observable<SubscriptionDataType<TSubscription>>(sub => {

            subscriptions.set(clientMessage.id, sub);

            wsWorker?.send(clientMessage);

            return () => {
               const unsubscribeMessage: UnsubscribeSubscriptionCommand = {
                  id: clientMessage.id,
                  name: 'command.subscription.unsubscribe'
               };
               wsWorker?.send({ id: v4(), data: unsubscribeMessage });
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
            //The message might contain object which Vue has created Symbols on which are not transferable
            wsWorker?.send(JSON.stringify(clientMessage));
         });
      }
   };
}
