import { Connection } from '@core/models';
import { ListItemType } from '@core/RpcService.js';
import { ref, Ref } from 'vue';
import { useRpc } from './rpc.js';

let r: Ref<Connection[] | undefined> | undefined;

export function useConnections(): Ref<Connection[] | undefined> {
   if (r) {
      return r;
   }

   const thisR = (r = ref<Connection[]>());

   const rpc = useRpc();

   Promise.resolve(
      rpc.configConnectionList((listItem) => {
         if (!r) {
            return;
         }

         if (listItem.type === ListItemType.InitialEmpty) {
            r.value = [];
            return;
         }

         const newArr = [...(r.value ?? [])];
         const existingIndex = newArr.findIndex((c) => c.name === listItem.item.name);
         if (listItem.type === ListItemType.Delete) {
            if (existingIndex === -1) {
               console.warn('Deleted connection does not exist');
               return;
            }
            newArr.splice(existingIndex, 1);
         } else if (existingIndex !== -1) {
            newArr.splice(existingIndex, 1, listItem.item);
         } else {
            newArr.push(listItem.item);
            newArr.sort((a, b) => a.name.localeCompare(b.name));
         }
         r.value = newArr;
      })
   ).then((sub) => {
      (thisR as any)[Symbol('subscription')] = sub;
   });

   return thisR;
}
