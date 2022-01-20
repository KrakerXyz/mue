import { Connection } from '@core/models';
import { ref, Ref } from 'vue';
import { useRpc } from './rpc.js';

let r: Ref<Connection[] | undefined> | undefined;

export function useConnections(): Ref<Connection[] | undefined> {
   if (r) {
      return r;
   }

   const thisR = (r = ref<Connection[]>());

   const rpc = useRpc();

   rpc.configConnectionList((con) => {
      if (!r) {
         return;
      }
      const newArr = [...(r.value ?? [])];
      const existingIndex = newArr.findIndex((c) => c.name === con.name);
      if (existingIndex !== -1) {
         newArr.splice(existingIndex, 1, con);
      } else {
         newArr.push(con);
         newArr.sort((a, b) => a.name.localeCompare(b.name));
      }
      r.value = newArr;
   });

   return thisR;
}
