import { RpcTransportMessage } from '../../../core/models/index.js';
import { FastifyRequest } from 'fastify';
import { SocketStream } from 'fastify-websocket';
import { DefaultSerializer, Transport } from 'rpc-thing';
import { WorkspaceServices } from './index.js';
import { RpcService } from './RpcService.js';

export class WebsocketRpc {
   public handler = async (socketStream: SocketStream, req: FastifyRequest) => {
      const log = req.log.child({ name: 'services.ws.WebSocketRpc.handler' });

      log.info('Incoming WS-RPC connection');

      const services = new WorkspaceServices();
      const rpcService = new RpcService(services);
      const transport: Transport = {
         invoke: () => {
            throw new Error('NotImplemented');
         },
      };
      const serializer = new DefaultSerializer(transport, rpcService);
      serializer.verboseLogging = true;

      socketStream.socket.on('message', async (buf: Buffer) => {
         const msg: RpcTransportMessage = JSON.parse(buf.toString());

         const result = await serializer.invoke(msg.data);

         const resultMessage: RpcTransportMessage = {
            id: msg.id,
            data: result,
         };
         socketStream.socket.send(JSON.stringify(resultMessage));
      });
   };
}
