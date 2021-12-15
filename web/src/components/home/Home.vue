<template>
   <workspace></workspace>
</template>

<script lang="ts">
   import { useConnections, useWs } from '@/services';
   import { defineComponent, inject, onUnmounted, watch } from 'vue';
   import Workspace from './Workspace.vue';
   import { WidgetManager } from './WidgetManager';

   export default defineComponent({
      components: { Workspace },
      props: {},
      setup() {
         const manager = inject<WidgetManager>(WidgetManager.INJECT);
         const ws = useWs();

         // eslint-disable-next-line no-undef
         const subs: ZenObservable.Subscription[] = [];

         const connections = useConnections();

         let initialized = false;
         watch(connections, (cons) => {
            if (!cons) {
               return;
            }
            if (initialized) {
               return;
            }
            initialized = true;

            if (!cons.length) {
               manager?.add('connections', {});
            } else {
               const obs = ws.subscribe({ name: 'subscription.config.workspace.state' });
               subs.push(
                  obs.subscribe((state) => {
                     if (!state.widgets.length) {
                        manager?.add('databases', {} as any);
                     } else {
                        manager?.setState(state);
                     }
                  })
               );
            }
         });

         onUnmounted(() => subs.forEach((s) => s.unsubscribe()));

         return {};
      },
   });
</script>
