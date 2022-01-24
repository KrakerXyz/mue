import { RpcTransportMessage } from '../../../core/models/index.js';
import { FastifyRequest } from 'fastify';
import { SocketStream } from 'fastify-websocket';
import { DefaultSerializer, Transport } from '@krakerxyz/rpc-thing';
import { WorkspaceServices } from './index.js';
import { createRpcService } from './RpcService.js';
import { v4 } from 'uuid';

export class WebsocketRpc {
   public handler = async (socketStream: SocketStream, req: FastifyRequest) => {
      const log = req.log.child({ name: 'services.ws.WebSocketRpc.handler' });

      log.info('Incoming WS-RPC connection');

      const services = new WorkspaceServices();
      const rpcService = createRpcService(services);
      const inFlight = new Map<string, (data: any) => void>();

      const transport: Transport = {
         invoke: async (data: unknown) => {
            const msg: RpcTransportMessage = {
               id: v4(),
               data,
            };

            const result = await new Promise<unknown>((r) => {
               inFlight.set(msg.id, r);
               socketStream.socket.send(JSON.stringify(msg));
            });

            return result;
         },
      };
      const serializer = new DefaultSerializer(transport, rpcService);
      serializer.verboseLogging = true;

      socketStream.socket.on('message', async (buf: Buffer) => {
         const msg: RpcTransportMessage = JSON.parse(buf.toString());

         const inflight = inFlight.get(msg.id);
         if (inflight) {
            inflight(msg.data);
            inFlight.delete(msg.id);
            return;
         }

         const result = await serializer.invoke(msg.data);

         const resultMessage: RpcTransportMessage = {
            id: msg.id,
            data: result,
         };
         socketStream.socket.send(JSON.stringify(resultMessage));
      });
   };
}
