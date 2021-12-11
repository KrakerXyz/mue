<template>
   <workspace></workspace>
</template>

<script lang="ts">
   import { useSubscription, useWs } from '@/services';
   import { defineComponent, provide } from 'vue';
   import Workspace, { WidgetManager } from './Workspace.vue';

   export default defineComponent({
      components: { Workspace },
      props: {},
      setup() {
         const manager = new WidgetManager();
         provide(WidgetManager.INJECT, manager);

         const ws = useWs();
         useSubscription(
            ws.subscribe({
               name: 'subscription.config.workspace.state',
            }),
            (state) => {
               if (!state.widgets.length) {
                  manager.add('databases', {} as any);
               } else {
                  manager.setState(state);
               }
            }
         );

         return {};
      },
   });
</script>
