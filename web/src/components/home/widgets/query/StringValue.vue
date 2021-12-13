<template>
   <div>
      <div v-if="value.parent.key === '_id' && !value.parent.parent.parent" class="text-orange">
         '<button class="btn btn-link p-0" @click="openId(value.value)">{{ value.value }}</button>'
      </div>
      <div v-else>
         <span class="text-orange">'{{ value.value }}'</span>
      </div>
   </div>
</template>

<script lang="ts">
   import { defineComponent, inject, computed } from 'vue';
   import { WidgetManager } from '../../WidgetManager';
   import { StringValue, ResultContext } from './ResultObjects';

   export default defineComponent({
      props: {
         value: { type: Object as () => StringValue, required: true },
         context: { type: Object as () => ResultContext, required: true },
      },
      setup(props) {
         const widgetManager = inject<WidgetManager>(WidgetManager.INJECT);

         const root = computed(() => props.value.parent.parent.root);

         const openId = (id: string) => {
            widgetManager?.add('query', {
               connection: root.value.connection,
               database: root.value.database,
               collection: root.value.collection,
               query: `db.getCollection('${root.value.collection}').find({_id: '${id}'})`,
            });
         };

         return { openId };
      },
   });
</script>
