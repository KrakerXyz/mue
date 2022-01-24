<template>
   <button class="list-group-item list-group-item-action font-monospace" @click="openQuery(collection)">
      <div class="row g-2">
         <div class="col">{{ collection.name }}</div>
      </div>
   </button>
</template>

<script lang="ts">
   import { defineComponent } from 'vue';
   import { Collection } from '@core/models';
   import { WidgetManager } from '@/services';

   export default defineComponent({
      props: {
         collection: { type: Object as () => Collection, required: true },
         connection: { type: String, required: true },
         database: { type: String, required: true },
         widgetManager: { type: Object as () => WidgetManager, required: true },
      },
      setup(props) {
         const openQuery = (c: Collection) => {
            props.widgetManager.add('query', {
               connection: props.connection,
               database: props.database,
               collection: c.name,
            } as any);
         };

         return { openQuery };
      },
   });
</script>
