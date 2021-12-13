<template>
   <workspace-widget>
      <template #header-icon>
         <i class="fal fa-database fa-fw fa-3x"></i>
      </template>
      <template #header>
         <div class="row g-2">
            <div class="col">
               <div class="form-floating">
                  <input id="name-filter" class="form-control" placeholder="*" v-model="nameFilter" />
                  <label for="name-filter">Databases</label>
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
                     <span class="badge bg-primary">{{ db.connectionName }}</span>
                  </div>
               </div>
            </button>
         </div>
      </template>
   </workspace-widget>
</template>

<script lang="ts">
   import { observableJoin, useSubscriptionRef, useWs } from '@/services';
   import { DatabaseListData } from '@core/subscriptions';
   import { defineComponent, watch, ref, computed, onUnmounted, inject } from 'vue';
   import { WidgetManager } from '../WidgetManager';
   import WorkspaceWidget from '../WorkspaceWidget.vue';

   export default defineComponent({
      components: {
         WorkspaceWidget,
      },
      setup() {
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
               .sort((a, b) => a.databaseName.localeCompare(b.databaseName));
         });

         const widgetManager = inject<WidgetManager>(WidgetManager.INJECT);
         const dbSelected = (db: SelectedDatabase) => {
            widgetManager?.add('collections', {
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
