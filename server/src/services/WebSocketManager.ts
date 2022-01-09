import { SubscriptionClientMessage, SubscriptionServerMessage } from '../../../core/subscriptions/index.js';
import { isSubscriptionClientMessage } from '../../../core/index.js';
import { CommandClientMessage, CommandServerMessage } from '../../../core/commands/index.js';
import { randomUUID } from 'crypto';
import { FastifyRequest } from 'fastify';
import { SocketStream } from 'fastify-websocket';
import Observable from 'zen-observable';
import { WorkspaceServices } from './index.js';
import { subscriptionHandlers } from './subscriptions/index.js';
import { commandHandlers } from './commands/index.js';

export class WebSocketManager {
   public handler = async (socketStream: SocketStream, req: FastifyRequest) => {
      const log = req.log.child({ name: 'services.ws.WebSocketManager.handler' });

      log.info('Incoming WS connection');

      const connection: Connection = {
         socket: socketStream.socket,
         services: new WorkspaceServices(),
         subscriptions: new Map(),
      };

      connection.socket.on('message', async (buf: Buffer) => {
         const msg: SubscriptionClientMessage | CommandClientMessage = JSON.parse(buf.toString());
         log.info(`WS: ${msg.data.name}`);

         if (isSubscriptionClientMessage(msg)) {
            if (connection.subscriptions.has(msg.id)) {
               throw new Error(`Subscription already present for id ${msg.id}`);
            }

            const nextPage$ = new Observable<void>((sub) => {
               const conSub = connection.subscriptions.get(msg.id);
               if (!conSub) {
                  throw new Error('connection subscription does not exist');
               }
               conSub.nextPageObserver = sub;
            });

            const obs = subscriptionHandlers[msg.data.name](msg.data, connection.services, nextPage$);

            const sub = obs.subscribe(
               (data) => {
                  const serverMessage: SubscriptionServerMessage = {
                     data,
                     id: randomUUID(),
                     name: msg.data.name,
                     replyTo: msg.id,
                  };
                  connection.socket.send(JSON.stringify(serverMessage));
               },
               (err) => {
                  connection.socket.send(
                     JSON.stringify({
                        error: err,
                        subscription: msg,
                     })
                  );
               }
            );

            connection.subscriptions.set(msg.id, { name: msg.data.name, subscription: sub, nextPageObserver: null });
         } else {
            if (msg.data.name === 'command.subscription.unsubscribe') {
               const sub = connection.subscriptions.get(msg.data.id);
               if (sub) {
                  sub.subscription.unsubscribe();
                  connection.subscriptions.delete(msg.data.id);
               }
               return;
            } else if (msg.data.name === 'command.subscription.nextPage') {
               const sub = connection.subscriptions.get(msg.data.id);
               if (!sub) {
                  connection.socket.send(
                     JSON.stringify({
                        error: `subscription ${msg.data.id} does not exist`,
                        command: msg,
                     })
                  );
                  return;
               }

               if (!sub.nextPageObserver) {
                  throw new Error('sub does not implement next page');
               }
               sub.nextPageObserver?.next();
            }

            const handler = commandHandlers[msg.data.name];
            await handler(msg.data, connection.services);

            connection.services.commandEvents.emit(msg.data.name, msg.data);

            const serverMessage: CommandServerMessage = {
               id: randomUUID(),
               replyTo: msg.id,
               name: msg.data.name,
               ok: true,
            };

            connection.socket.send(JSON.stringify(serverMessage));
         }
      });

      connection.socket.on('close', () => {
         log.info('WS connection closed');
         connection.subscriptions.forEach((s) => {
            s.subscription.unsubscribe();
            s.nextPageObserver?.complete();
         });
         connection.subscriptions.clear();
      });
   };
}

interface Connection {
   socket: any;
   services: WorkspaceServices;
   subscriptions: Map<
      string,
      {
         name: string;
         subscription: ZenObservable.Subscription;
         nextPageObserver: ZenObservable.SubscriptionObserver<void> | null;
      }
   >;
}
