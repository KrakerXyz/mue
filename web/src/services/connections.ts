import { Connection } from '@core/models';
import { ref, Ref } from 'vue';
import { useWs } from '.';

let r: Ref<Connection[] | undefined> | undefined;

export function useConnections(): Ref<Connection[] | undefined> {

   if (r) { return r; }

   const thisR = (r = ref<Connection[]>());

   const ws = useWs();
   ws.subscribe({ name: 'subscription.config.connections.list' }).subscribe(cons => thisR.value = cons.connections);

   return r;

}