import { ClientMessage } from '@core/commands';
import { randomUUID } from 'crypto';
import { FastifyRequest } from 'fastify';
import { SocketStream } from 'fastify-websocket';
import { WorkspaceServices } from '.';
import { commandHandlers } from './commands';

export class WebSocketManager {

    public handler = async (socketStream: SocketStream, req: FastifyRequest) => {

        const log = req.log.child({ name: 'services.ws.WebSocketManager.handler' });

        log.info('Incoming WS connection');

        const connection: Connection = {
            socket: socketStream.socket,
            services: new WorkspaceServices('fd429623-dc7c-4aa1-ad18-982f6fd5c428')
        };

        connection.socket.on('message', async (buf: Buffer) => {
            const msg: ClientMessage = JSON.parse(buf.toString());
            log.info('WS message', msg);

            const commandHandler = commandHandlers[msg.data.name];
            const commandResult = await commandHandler(msg.data, connection.services);

            const json = JSON.stringify({
                id: randomUUID(),
                replyTo: msg.id,
                data: commandResult
            });
            connection.socket.send(json);
        });

    };


}

interface Connection {
    socket: any;
    services: WorkspaceServices;
}