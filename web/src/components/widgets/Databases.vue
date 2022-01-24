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
            <button
               class="list-group-item list-group-item-action"
               v-for="db of dbs"
               :key="db.key"
               @click="dbSelected(db)"
               @contextmenu.prevent="setContextMenu(db.contextMenu, $event)"
            >
               <div class="row">
                  <div class="col text-truncate font-monospace">{{ db.database }}</div>
                  <div class="col-auto">
                     <v-connection-badge :name="db.connection"></v-connection-badge>
                  </div>
               </div>
            </button>
         </div>
         <div ref="contextMenuEl" class="context-menu list-group shadow" v-if="contextMenu">
            <button class="list-group-item list-group-item-action" :class="item.css" v-for="item of contextMenu" :key="item.id" @click="item.action()">
               {{ item.text }}
            </button>
         </div>
         <v-confirmation-modal v-if="confirmationVm" @cancel="confirmationVm = undefined" @confirm="confirmationVm?.callback()">
            <h3>Confirm Delete</h3>
            {{ confirmationVm.text }}
         </v-confirmation-modal>
      </template>
   </v-widget-template>
</template>

<script lang="ts">
   import { useConnections, useRpc, useWindowListener, WidgetManager } from '@/services';
   import { defineComponent, watch, ref, computed, onUnmounted, nextTick } from 'vue';
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
               subs.forEach((s) => s.unsubscribe());
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
                     if (dbItem.type === ListItemType.InitialEmpty) {
                        rawDbs.value = [];
                        return;
                     }

                     const newList = [...rawDbs.value];
                     const existingIndex = newList.findIndex((d) => d.connection === dbItem.item.connection && d.name === dbItem.item.name);
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
               .sort((a, b) => a.name.localeCompare(b.name) || a.connection.localeCompare(b.connection))
               .map((d) => {
                  const vm: DatabaseVm = {
                     key: `${d.connection}-${d.name}`,
                     connection: d.connection,
                     database: d.name,
                     contextMenu: [
                        {
                           id: 'copy',
                           text: 'Copy to',
                           action: () => {
                              props.widgetManager.add('copy', { fromConnection: d.connection, fromDatabase: d.name });
                           },
                        },
                        {
                           id: 'delete',
                           text: 'Delete',
                           css: ['list-group-item-danger'],
                           action: () => {
                              confirmationVm.value = {
                                 text: `Are you sure you want to delete ${d.name} from ${d.connection}?`,
                                 callback: () => {
                                    rpc.mongoDatabaseDelete(d).then(() => console.debug(`Deleted ${d.name}`));
                                    confirmationVm.value = undefined;
                                 },
                              };
                           },
                        },
                     ],
                  };
                  return vm;
               });
         });

         const dbSelected = (db: DatabaseVm) => {
            props.widgetManager.add('collections', {
               connection: db.connection,
               database: db.database,
            } as any);
         };

         const windowClickSub = useWindowListener('click', () => {
            contextMenu.value = null;
         });
         onUnmounted(() => windowClickSub());

         const contextMenu = ref<ContextOption[] | null>(null);
         const contextMenuEl = ref<HTMLDivElement>();
         const setContextMenu = async (menu: ContextOption[] | null, evt: MouseEvent) => {
            contextMenu.value = menu;
            await nextTick();
            if (!contextMenuEl.value) {
               return;
            }
            contextMenuEl.value.style.top = `${evt.y}px`;
            contextMenuEl.value.style.left = `${evt.x}px`;
         };

         const confirmationVm = ref<ConfirmationVm>();

         return {
            dbs,
            newNameFilter,
            dbSelected,
            connectionNames,
            toggleConnection,
            connectionFilters,
            contextMenu,
            setContextMenu,
            contextMenuEl,
            confirmationVm,
         };
      },
   });

   interface DatabaseVm {
      key: string;
      connection: string;
      database: string;
      contextMenu: ContextOption[] | null;
   }

   type ContextOption = {
      id: string;
      text: string;
      css?: string[];
      action: () => void;
   };

   interface ConfirmationVm {
      text: string;
      callback: () => void;
   }
</script>

<style lang="postcss" scoped>
   .context-menu {
      position: fixed;
      z-index: 1;
      min-width: 200px;
   }
</style>
