<template>
   <v-widget-template :widget="widget" :widgetManager="widgetManager">
      <template #header-icon>
         <i class="fal fa-layer-group fa-fw fa-3x"></i>
      </template>
      <template #header>
         <div class="row g-2">
            <div class="col-auto">
               <h4 class="mb-0">Collections: {{ database }}</h4>
            </div>
            <div class="col-auto">
               <span class="badge bg-primary">{{ connection }}</span>
            </div>
            <div class="col">
               <input class="form-control" v-model="nameFilter" placeholder="Filter" />
            </div>
         </div>
      </template>
      <template #body>
         <div v-if="filteredCols" class="list-group list-group-flush h-100 overflow-auto">
            <button v-for="c of filteredCols" :key="c.name" class="list-group-item list-group-item-action font-monospace" @click="openQuery(c)">
               {{ c.name }}
            </button>
         </div>
      </template>
   </v-widget-template>
</template>

<script lang="ts">
   import { useSubscriptionRef, useWs, WidgetManager } from '@/services';
   import { computed, defineComponent, ref } from 'vue';
   import { Collection, Widget } from '@core/models';

   export default defineComponent({
      props: {
         connection: { type: String, required: true },
         database: { type: String, required: true },
         widget: { type: Object as () => Widget, required: true },
         widgetManager: { type: Object as () => WidgetManager, required: true },
      },
      setup(props) {
         const ws = useWs();
         const cols = useSubscriptionRef(
            ws
               .subscribe({
                  name: 'subscription.mongo.database.collections.list',
                  connection: props.connection,
                  database: props.database,
               })
               .map((r) => r.collections.sort((a, b) => a.name.localeCompare(b.name)))
         );

         const openQuery = (c: Collection) => {
            props.widgetManager.add('query', {
               connection: props.connection,
               database: props.database,
               collection: c.name,
            } as any);
         };

         const nameFilter = ref<string>();

         const filteredCols = computed(() => {
            if (!nameFilter.value) {
               return cols.value;
            }
            const lowerName = nameFilter.value.toLocaleLowerCase();
            return cols.value?.filter((c) => c.name.toLocaleLowerCase().includes(lowerName));
         });

         return { filteredCols, openQuery, nameFilter };
      },
   });
</script>
