import { reactive, readonly } from '@vue/reactivity';
import { v4 } from 'uuid';
import { Command, ServerMessage, ClientMessage } from '@core/commands';

let ws: WebSocket | undefined;
const state = reactive({
   connected: false
});

const inflight = new Map<string, { resolve: (msg: ServerMessage) => void | Promise<void>, reject: () => void }>();

export function useWs() {
   if (!ws) {
      const url = `ws${window.location.protocol === 'https' ? 's' : ''}://${window.location.host}/ws`;
      ws = new WebSocket(url);
      ws.addEventListener('open', () => {
         state.connected = true;
      });
      ws.addEventListener('close', () => {
         state.connected = false;
      });
      ws.addEventListener('message', data => {
         const obj: ServerMessage = JSON.parse(data.data);
         const prom = inflight.get(obj.replyTo);
         if (!prom) { return; }
         prom.resolve(obj);
      });
   }

   return {
      state: readonly(state),
      send<TCommand extends Command>(command: TCommand): Promise<ServerMessage<TCommand>> {
         const wsMsg: ClientMessage = {
            id: v4(),
            data: command
         };

         return new Promise((resolve, reject) => {
            inflight.set(wsMsg.id, { resolve, reject });
            ws?.send(JSON.stringify(wsMsg));
         });

      }
   };
}
