<template>
   <workspace></workspace>
</template>

<script lang="ts">
   import { useSubscription, useWs } from '@/services';
   import { defineComponent, inject } from 'vue';
   import Workspace from './Workspace.vue';
   import { WidgetManager } from './WidgetManager';

   export default defineComponent({
      components: { Workspace },
      props: {},
      setup() {
         const manager = inject<WidgetManager>(WidgetManager.INJECT);
         const ws = useWs();
         useSubscription(
            ws.subscribe({
               name: 'subscription.config.workspace.state',
            }),
            (state) => {
               if (!state.widgets.length) {
                  manager?.add('databases', {} as any);
               } else {
                  manager?.setState(state);
               }
            }
         );

         return {};
      },
   });
</script>
