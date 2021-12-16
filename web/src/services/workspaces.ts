import { Workspace } from '@core/models';
import { ref, Ref } from 'vue';
import { useWs } from '.';

let r: Ref<Workspace[] | undefined> | undefined;

export function useWorkspaces(): Ref<Workspace[] | undefined> {

   if (r) { return r; }

   const thisR = (r = ref<Workspace[]>());

   const ws = useWs();
   ws.subscribe({ name: 'subscription.config.workspaces.list' }).subscribe(wss => thisR.value = wss.workspaces);

   return r;

}