<template>
   <div class="h-100 d-flex flex-column">
      <span v-if="!dbs">Loading databases</span>

      <template v-if="dbs">
         <div class="row">
            <div class="col">
               <div class="form-floating">
                  <input id="name-filter" class="form-control" placeholder="*" v-model="nameFilter" />
                  <label for="name-filter">Name Filter</label>
               </div>
            </div>
         </div>

         <div class="flex-grow-1 overflow-auto mt-1" v-if="dbs">
            <div class="list-group">
               <button class="list-group-item list-group-item-action" v-for="db of dbs" :key="db.key" @click="$emit('selected', db)">
                  <div class="row">
                     <div class="col">{{ db.databaseName }}</div>
                     <div class="col-auto text-muted small">{{ db.connectionName }}</div>
                  </div>
               </button>
            </div>
         </div>
      </template>
   </div>
</template>

<script lang="ts">
   import { useWs } from '@/services';
   import { defineComponent, watch, ref, computed } from 'vue';
   import { ListDatabasesResult } from '@core/commands';

   export default defineComponent({
      emits: {
         selected: (value: SelectedDatabase) => !!value,
      },
      setup() {
         const ws = useWs();

         const rawDbs = ref<ListDatabasesResult>();

         watch(
            ws.state,
            async (state) => {
               if (!state.connected) {
                  return;
               }
               const result = await ws.send({
                  name: 'mongo.server.listDatabases',
               });
               rawDbs.value = result.data;
            },
            { immediate: true }
         );

         const nameFilter = ref<string>('');

         const dbs = computed(() => {
            if (!rawDbs.value) {
               return;
            }
            const nameFilterLower = nameFilter.value.toLocaleLowerCase();
            return rawDbs.value
               .flatMap((c) =>
                  c.databases
                     .filter((d) => !d.empty && (!nameFilterLower || d.name.toLocaleLowerCase().includes(nameFilterLower)))
                     .map((d) => ({ key: `${c.connectionName}-${d.name}`, connectionName: c.connectionName, databaseName: d.name }))
               )
               .sort((a, b) => a.databaseName.localeCompare(b.databaseName));
         });

         return { dbs, nameFilter };
      },
   });

   export interface SelectedDatabase {
      key: string;
      connectionName: string;
      databaseName: string;
   }
</script>
