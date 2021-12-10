import { SubscriptionClientMessage, SubscriptionDataType, SubscriptionServerMessage } from '@core/subscriptions';
import { isSubscriptionClientMessage } from '@core/index';
import { CommandClientMessage, CommandServerMessage } from '@core/commands';
import { randomUUID } from 'crypto';
import { FastifyRequest } from 'fastify';
import { SocketStream } from 'fastify-websocket';
import Observable from 'zen-observable';
import { WorkspaceServices } from '.';
import { subscriptionHandlers } from './subscriptions';
import { commandHandlers } from './commands';

export class WebSocketManager {

    public handler = async (socketStream: SocketStream, req: FastifyRequest) => {

        const log = req.log.child({ name: 'services.ws.WebSocketManager.handler' });

        log.info('Incoming WS connection');

        const connection: Connection = {
            socket: socketStream.socket,
            services: new WorkspaceServices('fd429623-dc7c-4aa1-ad18-982f6fd5c428'),
            subscriptions: new Map()
        };

        connection.socket.on('message', async (buf: Buffer) => {
            const msg: SubscriptionClientMessage | CommandClientMessage = JSON.parse(buf.toString());
            log.info('WS message', msg);

            if (isSubscriptionClientMessage(msg)) {

                if (connection.subscriptions.has(msg.id)) { throw new Error(`Subscription already present for id ${msg.id}`); }

                const obs = subscriptionHandlers[msg.data.name](msg.data, connection.services);

                connection.subscriptions.set(msg.id, { name: msg.data.name, observable: obs });

                obs.subscribe(data => {
                    const serverMessage: SubscriptionServerMessage = {
                        data,
                        id: randomUUID(),
                        name: msg.data.name,
                        replyTo: msg.id
                    };
                    connection.socket.send(JSON.stringify(serverMessage));
                });

            } else {

                const handler = commandHandlers[msg.data.name];
                await handler(msg.data, connection.services);

                const serverMessage: CommandServerMessage = {
                    id: randomUUID(),
                    replyTo: msg.id,
                    name: msg.data.name,
                    ok: true
                };

                connection.socket.send(JSON.stringify(serverMessage));
            }

        });

    };


}

interface Connection {
    socket: any;
    services: WorkspaceServices;
    subscriptions: Map<string, { name: string, observable: Observable<SubscriptionDataType<any>> }>;
}