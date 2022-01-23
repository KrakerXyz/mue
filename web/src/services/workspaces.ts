import { Workspace } from '@core/models';
import { ListItemType } from '@core/RpcService.js';
import { computed, ref, Ref } from 'vue';
import { useRpc } from './rpc.js';

let r: Ref<Workspace[] | undefined> | undefined;

export function useWorkspaces(): Ref<Workspace[] | undefined> {
   if (r) {
      return r;
   }

   const thisR = (r = ref<Workspace[]>());

   const rpc = useRpc();

   rpc.configWorkspaceList((listItem) => {
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
            console.warn('Deleted workspace does not exist');
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
   }).then((sub) => {
      (thisR as any)[Symbol('subscription')] = sub;
   });

   return thisR;
}

const windowLocation = ref<string>();
const setWindowLocation = () => {
   windowLocation.value = window.location.pathname.split('/')[1];
};
window.addEventListener(
   'popstate',
   () => {
      setWindowLocation();
   },
   { passive: true, capture: true }
);
setWindowLocation();

export function useSelectedWorkspaceId(): Ref<string | undefined> {
   const r = computed({
      get() {
         return windowLocation.value;
      },
      set(value: string | undefined) {
         window.history.replaceState({}, 'mue', `/${value}`);
         setWindowLocation();
      },
   });
   return r;
}
