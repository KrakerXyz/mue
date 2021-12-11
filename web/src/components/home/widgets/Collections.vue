<template>
   <workspace-widget>
      <template #header>
         <div class="row g-2">
            <div class="col-auto"><i class="fal fa-layer-group fa-fw fa-3x"></i></div>
            <div class="col">
               <div class="form-floating">
                  <input id="name-filter" class="form-control" placeholder="*" v-model="nameFilter" />
                  <label for="name-filter">{{ database }}</label>
               </div>
            </div>
            <div class="col-auto">
               <span class="badge bg-primary">{{ connection }}</span>
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
   </workspace-widget>
</template>

<script lang="ts">
   import { useSubscriptionRef, useWs } from '@/services';
   import { computed, defineComponent, inject, ref } from 'vue';
   import WorkspaceWidget from '../WorkspaceWidget.vue';
   import { WidgetManager } from '../Workspace.vue';
   import { Collection } from '@core/models';

   export default defineComponent({
      components: { WorkspaceWidget },
      props: {
         connection: { type: String, required: true },
         database: { type: String, required: true },
      },
      setup(props) {
         const widgetManager = inject<WidgetManager>(WidgetManager.INJECT);
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
            widgetManager?.add('query', {
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
