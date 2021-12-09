import { randomUUID } from 'crypto';
import { FastifyLoggerInstance, FastifyRequest } from 'fastify';
import { SocketStream } from 'fastify-websocket';
import { ClientMessage, Command, CommandResultData } from '@core/ws';
import { processMongo } from './processMongo';

export class WebSocketManager {

    public constructor(private _rootLog: FastifyLoggerInstance) {

    }

    public handler = async (socketStream: SocketStream, req: FastifyRequest) => {

        const log = req.log.child({ name: 'services.ws.WebSocketManager.handler' });

        log.info('Incoming WS connection');

        socketStream.socket.on('message', async (buf: Buffer) => {
            const msg: ClientMessage = JSON.parse(buf.toString());
            log.info('WS message', msg);

            let data: CommandResultData<Command> | undefined;
            if (msg.data.command.startsWith('mongo')) {
                data = await processMongo(msg.data);
            } else {
                req.log.warn(`Invalid command ${msg.data.command} received from client`);
                return;
            }

            const json = JSON.stringify({
                id: randomUUID(),
                replyTo: msg.id,
                data
            });
            socketStream.socket.send(json);
        });

    };


}