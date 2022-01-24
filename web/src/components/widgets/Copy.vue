<template>
   <v-widget-template :widget="widget" :widgetManager="widgetManager">
      <template #header-icon>
         <i class="fal fa-file-import fa-fw fa-3x"></i>
      </template>
      <template #header>
         <h4 class="mb-0">Copy Database</h4>
      </template>
      <template #body>
         <div class="p-3 h-100">
            <template v-if="!statusMessage">
               <div class="row">
                  <div class="col">
                     <div class="form-floating">
                        <select id="from-connection" class="form-select" placeholder="*" v-model="copyDetail.fromConnection">
                           <option v-for="con of connections" :key="con.name">{{ con.name }}</option>
                        </select>
                        <label for="from-connection">From Connection</label>
                     </div>
                  </div>
                  <div class="col">
                     <div class="form-floating">
                        <select id="from-database" class="form-select" placeholder="*" v-model="copyDetail.fromDatabase">
                           <option v-for="db of fromDatabaseList" :key="db.name">{{ db.name }}</option>
                        </select>
                        <label for="from-database">From Database</label>
                     </div>
                  </div>
               </div>
               <div class="row mt-3">
                  <div class="col">
                     <div class="form-floating">
                        <select id="to-connection" class="form-select" placeholder="*" v-model="copyDetail.toConnection">
                           <option v-for="con of connections" :key="con.name">{{ con.name }}</option>
                        </select>
                        <label for="to-connection">To Connection</label>
                     </div>
                  </div>
                  <div class="col">
                     <div class="form-floating">
                        <input id="to-database" class="form-control" placeholder="*" v-model="copyDetail.toDatabase" />
                        <label for="to-database">To Database</label>
                     </div>
                  </div>
               </div>
               <div class="row mt-4">
                  <div class="col-6">
                     <button class="btn btn-primary w-100" :disabled="!isValid" @click="startTransfer()">Start Transfer</button>
                  </div>
               </div>
            </template>
            <template v-else>
               <textarea class="form-control h-100" readonly :value="statusMessage"></textarea>
            </template>
         </div>
      </template>
   </v-widget-template>
</template>

<script lang="ts">
   import { useConnections, useRpc, WidgetManager } from '@/services';
   import { Database, DatabaseCopyConfig, DatabaseCopyStatus, Widget } from '@core/models';
   import { ListItemType, Subscription } from '@core/RpcService';
   import { computed, defineComponent, onUnmounted, reactive, ref, watch } from 'vue';

   export default defineComponent({
      props: {
         widget: { type: Object as () => Widget, required: true },
         widgetManager: { type: Object as () => WidgetManager, required: true },
         fromConnection: { type: String, default: () => null },
         fromDatabase: { type: String, default: () => null },
         toConnection: { type: String, default: () => null },
         toDatabase: { type: String, default: () => null },
      },
      setup(props) {
         const rpc = useRpc();
         const connections = useConnections();

         const copyDetail = reactive<DatabaseCopyConfig>({
            fromConnection: props.fromConnection,
            fromDatabase: props.fromDatabase,
            toConnection: props.toConnection,
            toDatabase: props.toDatabase,
         });

         const fromDatabaseList = ref<Database[]>();

         let dbListSub: Subscription | null = null;
         const populateToDatabaseList = async (connection: string) => {
            dbListSub?.unsubscribe();

            dbListSub = await rpc.mongoDatabaseList(connection, (listItem) => {
               if (listItem.type === ListItemType.InitialEmpty) {
                  fromDatabaseList.value = [];
                  return;
               }

               const newArr = fromDatabaseList.value ?? [];
               const existingIndex = newArr.findIndex((d) => d.name === listItem.item.name);
               if (existingIndex === -1) {
                  if (listItem.type !== ListItemType.Delete) {
                     newArr.push(listItem.item);
                  }
               } else {
                  if (listItem.type === ListItemType.Delete) {
                     newArr.splice(existingIndex, 1);
                  } else {
                     newArr.splice(existingIndex, 1, listItem.item);
                  }
               }

               fromDatabaseList.value = newArr.sort((a, b) => a.name.localeCompare(b.name));
            });
         };
         onUnmounted(() => dbListSub?.unsubscribe());

         watch(() => copyDetail.fromConnection, populateToDatabaseList, { immediate: true });

         watch(
            () => copyDetail.fromDatabase,
            (db) => {
               copyDetail.toDatabase = db;
            },
            { immediate: true }
         );

         const isValid = computed(() => {
            if (!copyDetail.fromConnection) {
               return false;
            }
            if (!copyDetail.fromDatabase) {
               return false;
            }
            if (!copyDetail.toConnection) {
               return false;
            }
            if (!copyDetail.toDatabase) {
               return false;
            }
            return true;
         });

         const transferStatus = ref<DatabaseCopyStatus[]>();
         let transferSub: Subscription | null = null;
         const startTransfer = async () => {
            transferStatus.value = [{ status: 'Starting' }];
            transferSub = await rpc.mongoDatabaseCopy(copyDetail, (status) => {
               transferStatus.value?.splice(0, 0, status);
               console.debug(status.status);
            });
         };

         const statusMessage = computed(() => transferStatus.value?.map((s) => s.status).join('\r\n'));

         onUnmounted(() => transferSub?.unsubscribe());

         return { connections, copyDetail, isValid, fromDatabaseList, startTransfer, statusMessage };
      },
   });
</script>
