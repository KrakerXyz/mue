import { RpcThing, DefaultSerializer, type Transport, type PromisfiedService } from 'rpc-thing';
import { type RpcService } from '@core/RpcService';
import { type RpcTransportMessage } from '@core/models';
import { v4 } from 'uuid';

let thing: RpcThing<RpcService> | undefined;

export function useRpc(): PromisfiedService<RpcService> {
   if (thing) {
      return thing.target;
   }

   const transport = createTransport();
   const serializer = new DefaultSerializer<RpcService>(transport, {} as any);
   serializer.verboseLogging = true;

   thing = new RpcThing<RpcService>(serializer);

   return thing.target;
}

function createTransport(): Transport {
   const url = 'ws://localhost:3000/ws-rpc';
   const ws = new WebSocket(url);
   const inFlight = new Map<string, (data: any) => void>();

   ws.addEventListener('message', (data) => {
      const obj: RpcTransportMessage = JSON.parse(data.data);
      const resolver = inFlight.get(obj.id);
      if (!resolver) {
         throw new Error(`Resolver not found for transport message id ${obj.id}`);
      }
      resolver(obj.data);
      inFlight.delete(obj.id);
   });

   let readyResolver: () => void = () => {
      /* */
   };
   let readyProm = new Promise<void>((r) => (readyResolver = r));

   ws.addEventListener('open', () => {
      readyResolver();
   });

   ws.addEventListener('close', () => {
      readyProm = new Promise<void>((r) => (readyResolver = r));
   });

   const transport: Transport = {
      invoke: async (data: unknown): Promise<unknown> => {
         const msg: RpcTransportMessage = {
            id: v4(),
            data,
         };

         await readyProm;
         const result = await new Promise<unknown>((r) => {
            inFlight.set(msg.id, r);
            ws.send(JSON.stringify(msg));
         });

         return result;
      },
   };

   return transport;
}
