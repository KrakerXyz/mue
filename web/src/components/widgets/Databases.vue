<template>
   <v-widget-template :widget="widget" :widgetManager="widgetManager">
      <template #header-icon>
         <i class="fal fa-database fa-fw fa-3x"></i>
      </template>
      <template #header>
         <div class="row g-2">
            <div class="col">
               <h4 class="mb-0">Databases</h4>
            </div>
         </div>
      </template>
      <template #header2>
         <div class="row mt-2">
            <div class="col">
               <input class="form-control" v-model="newNameFilter" placeholder="Filter" />
            </div>
         </div>
         <div class="row mt-2">
            <div class="col-aut">
               <div class="form-check form-check-inline" v-for="name of connectionNames" :key="name">
                  <input
                     class="form-check-input"
                     type="checkbox"
                     :id="'conn-' + name"
                     @change="toggleConnection(name)"
                     :checked="connectionFilters?.includes(name)"
                  />
                  <label class="form-check-label" :for="'conn-' + name"><v-connection-badge :name="name"></v-connection-badge></label>
               </div>
            </div>
         </div>
      </template>

      <template #body>
         <div v-if="dbs" class="list-group list-group-flush h-100 overflow-auto">
            <button class="list-group-item list-group-item-action" v-for="db of dbs" :key="db.key" @click="dbSelected(db)">
               <div class="row">
                  <div class="col text-truncate font-monospace">{{ db.databaseName }}</div>
                  <div class="col-auto">
                     <v-connection-badge :name="db.connectionName"></v-connection-badge>
                  </div>
               </div>
            </button>
         </div>
      </template>
   </v-widget-template>
</template>

<script lang="ts">
   import { useConnections, useRpc, WidgetManager } from '@/services';
   import { defineComponent, watch, ref, computed, onUnmounted } from 'vue';
   import { Widget, Database } from '@core/models';
   import { ListItemType, Subscription } from '@core/RpcService';

   export default defineComponent({
      props: {
         connections: { type: Array as () => string[], default: () => null },
         nameFilter: { type: String, default: () => null },

         widget: { type: Object as () => Widget, required: true },
         widgetManager: { type: Object as () => WidgetManager, required: true },
      },
      setup(props) {
         const rpc = useRpc();

         const connections = useConnections();

         const connectionNames = computed(() => connections.value?.map((c) => c.name));

         const connectionFilters = ref<string[] | undefined>(props.connections);
         watch(
            () => props.connections,
            (cons) => (connectionFilters.value = cons)
         );

         watch(connectionFilters, (filter) => {
            props.widgetManager.updateProps(props.widget, { connections: filter ?? null });
         });

         const toggleConnection = (name: string) => {
            if (connectionFilters.value?.includes(name)) {
               connectionFilters.value = connectionFilters.value.filter((n) => n !== name);
               if (!connectionFilters.value.length) {
                  connectionFilters.value = undefined;
               }
            } else {
               connectionFilters.value = [...(connectionFilters.value ?? []), name];
            }
         };

         const rawDbs = ref<Database[]>([]);

         // eslint-disable-next-line no-undef
         let subsProm: Promise<Subscription[]> | undefined;

         const unsub = () => {
            subsProm?.then((subs) => {
               subs.forEach((s) => s());
            });
         };

         watch(
            connections,
            (connections) => {
               unsub();
               subsProm = undefined;
               if (!connections) {
                  return;
               }
               const newSubs = connections.map((c) =>
                  rpc.mongoDatabaseList(c.name, (dbItem) => {
                     const newList = [...rawDbs.value];
                     const existingIndex = newList.findIndex((d) => d.name === dbItem.item.name);
                     if (dbItem.type === ListItemType.Delete) {
                        if (existingIndex !== -1) {
                           newList.splice(existingIndex, 1);
                        }
                     } else if (existingIndex === -1) {
                        newList.push(dbItem.item);
                     } else {
                        newList[existingIndex] = dbItem.item;
                     }
                     rawDbs.value = newList;
                  })
               );
               subsProm = Promise.all(newSubs);
            },
            { immediate: true }
         );

         onUnmounted(() => {
            unsub();
         });

         const newNameFilter = ref<string>(props.nameFilter ?? '');

         watch(newNameFilter, (name) => props.widgetManager.updateProps(props.widget, { nameFilter: name }));

         const dbs = computed(() => {
            if (!rawDbs.value) {
               return;
            }
            const nameFilterLower = newNameFilter.value.toLocaleLowerCase();
            return rawDbs.value
               .filter((d) => !connectionFilters.value || connectionFilters.value.includes(d.connection))
               .filter((d) => !nameFilterLower || d.name.toLocaleLowerCase().includes(nameFilterLower))
               .map((d) => ({ key: `${d.connection}-${d.name}`, connectionName: d.connection, databaseName: d.name }))
               .sort((a, b) => a.databaseName.localeCompare(b.databaseName) || a.connectionName.localeCompare(b.connectionName));
         });

         const dbSelected = (db: SelectedDatabase) => {
            props.widgetManager.add('collections', {
               connection: db.connectionName,
               database: db.databaseName,
            } as any);
         };

         return { dbs, newNameFilter, dbSelected, connectionNames, toggleConnection, connectionFilters };
      },
   });

   export interface SelectedDatabase {
      key: string;
      connectionName: string;
      databaseName: string;
   }
</script>
