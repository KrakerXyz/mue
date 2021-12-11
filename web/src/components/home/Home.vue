<template>
   <workspace></workspace>
</template>

<script lang="ts">
   import { defineComponent, provide } from 'vue';
   import Databases from './Databases.vue';
   import Workspace, { WidgetManager } from './Workspace.vue';

   export default defineComponent({
      components: { Workspace },
      props: {},
      setup() {
         const manager = new WidgetManager();
         provide(WidgetManager.INJECT, manager);

         manager.add(Databases, {} as any);
         return {};
      },
   });
</script>
