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
            <div class="col">
               <input class="form-control" v-model="nameFilter" placeholder="Filter" />
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
   import { observableJoin, useSubscriptionRef, useWs, WidgetManager } from '@/services';
   import { DatabaseListData } from '@core/subscriptions';
   import { defineComponent, watch, ref, computed, onUnmounted } from 'vue';
   import { Widget } from '@core/models';

   export default defineComponent({
      props: {
         widget: { type: Object as () => Widget, required: true },
         widgetManager: { type: Object as () => WidgetManager, required: true },
      },
      setup(props) {
         const ws = useWs();

         const connections = useSubscriptionRef(
            ws
               .subscribe({
                  name: 'subscription.config.connections.list',
               })
               .map((d) => d.connections)
         );

         const databaseLists$Array = computed(() => {
            if (!connections.value) {
               return [];
            }
            return connections.value.map((c) => {
               return ws.subscribe({
                  name: 'subscription.mongo.server.databases.list',
                  connection: c.name,
               });
            });
         });

         const allDbs$ = computed(() => {
            return observableJoin(databaseLists$Array.value);
         });

         const rawDbs = ref<DatabaseListData[]>([]);

         // eslint-disable-next-line no-undef
         let sub: ZenObservable.Subscription | undefined;
         watch(allDbs$, (dbs$) => {
            if (sub) {
               sub.unsubscribe();
            }
            sub = dbs$.subscribe((data) => {
               const newArr = rawDbs.value.filter((d) => d.connection !== data.connection);
               newArr.push(data);
               rawDbs.value = newArr;
            });
         });

         onUnmounted(() => sub?.unsubscribe());

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
                     .map((d) => ({ key: `${c.connection}-${d.name}`, connectionName: c.connection, databaseName: d.name }))
               )
               .sort((a, b) => a.databaseName.localeCompare(b.databaseName) || a.connectionName.localeCompare(b.connectionName));
         });

         const dbSelected = (db: SelectedDatabase) => {
            props.widgetManager.add('collections', {
               connection: db.connectionName,
               database: db.databaseName,
            } as any);
         };

         return { dbs, nameFilter, dbSelected };
      },
   });

   export interface SelectedDatabase {
      key: string;
      connectionName: string;
      databaseName: string;
   }
</script>
