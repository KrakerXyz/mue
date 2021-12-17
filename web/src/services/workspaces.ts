import { Workspace } from '@core/models';
import { computed, ref, Ref } from 'vue';
import { useWs } from '.';

let r: Ref<Workspace[] | undefined> | undefined;

export function useWorkspaces(): Ref<Workspace[] | undefined> {

   if (r) { return r; }

   const thisR = (r = ref<Workspace[]>());

   const ws = useWs();
   ws.subscribe({ name: 'subscription.config.workspaces.list' }).subscribe(wss => thisR.value = wss.workspaces);

   return r;

}

const windowLocation = ref<string>();
const setWindowLocation = () => {
   windowLocation.value = window.location.pathname.split('/')[1];
};
window.addEventListener('popstate', () => {
   setWindowLocation();
}, { passive: true, capture: true });
setWindowLocation();

export function useSelectedWorkspaceId(): Ref<string | undefined> {
   const r = computed({
      get() {
         return windowLocation.value;
      },
      set(value: string | undefined) {
         window.history.replaceState({}, 'mue', `/${value}`);
         setWindowLocation();
      }
   });
   return r;
}