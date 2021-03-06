<template>
   <v-widget-template :widget="widget" :widgetManager="widgetManager">
      <template #header-icon>
         <i class="fal fa-ethernet fa-fw fa-3x"></i>
      </template>
      <template #header>
         <h4 class="mb-0">Connections</h4>
      </template>

      <template #body>
         <div v-if="connections" class="list-group list-group-flush h-100 overflow-auto">
            <button class="list-group-item list-group-item-action" v-for="con of connections" :key="con.name" @click="openDatabases(con)">
               <div class="row g-2">
                  <div class="col-auto">
                     <v-connection-badge :name="con.name"></v-connection-badge>
                  </div>
                  <div class="col text-muted small font-monospace text-truncate d-flex align-items-center">{{ con.connectionString }}</div>
                  <div class="col-auto">
                     <button class="btn p-0 text-danger" @click.stop="confirmDelete = con"><i class="fal fa-trash-alt"></i></button>
                  </div>
               </div>
            </button>
            <div class="list-group-item">
               <h5 class="mt-2">New Connection</h5>
               <form class="row g-2" @submit.prevent="addConnection()">
                  <div class="col-md-4">
                     <div class="form-floating">
                        <input id="new-name" class="form-control" placeholder="*" v-model="newConnection.name" :disabled="isSaving" />
                        <label for="new-name">Name</label>
                     </div>
                  </div>
                  <div class="col">
                     <div class="form-floating">
                        <input id="new-string" class="form-control" placeholder="*" v-model="newConnection.connectionString" :disabled="isSaving" />
                        <label for="new-string">Connection String</label>
                     </div>
                  </div>
                  <div class="col-md-auto">
                     <button class="btn btn-primary h-100 w-100" :disabled="!isNewValid || isSaving">Add</button>
                  </div>
               </form>
            </div>
         </div>
         <v-confirmation-modal v-if="confirmDelete" @cancel="confirmDelete = undefined" @confirm="deleteConnection()">
            <h3>Confirm Delete</h3>
            Are you sure you want to delete
            <v-connection-badge :name="confirmDelete.name" class="me-2"></v-connection-badge>
            ?
         </v-confirmation-modal>
      </template>
   </v-widget-template>
</template>

<script lang="ts">
   import { useConnections, useRpc, WidgetManager } from '@/services';
   import { Connection, Widget } from '@core/models';
   import { computed, defineComponent, reactive, ref } from 'vue';

   export default defineComponent({
      props: {
         widget: { type: Object as () => Widget, required: true },
         widgetManager: { type: Object as () => WidgetManager, required: true },
      },
      setup(props) {
         const rpc = useRpc();

         const connections = useConnections();

         const newConnection = reactive<Connection>({ name: '', connectionString: 'mongodb://' });

         const isNewValid = computed(
            () =>
               newConnection.name &&
               (newConnection.connectionString.startsWith('mongodb+srv://') || newConnection.connectionString.startsWith('mongodb://')) &&
               newConnection.connectionString.replaceAll('mongodb+srv://', '').replaceAll('mongodb://', '')
         );

         const isSaving = ref(false);
         const addConnection = async () => {
            isSaving.value = true;
            await rpc.configConnectionPut(newConnection);
            newConnection.name = '';
            newConnection.connectionString = 'mongodb://';
            isSaving.value = false;
         };

         const confirmDelete = ref<Connection>();
         const deleteConnection = async () => {
            if (!confirmDelete.value || !connections.value) {
               return;
            }
            await rpc.configConnectionDelete(confirmDelete.value);
            confirmDelete.value = undefined;
         };

         const openDatabases = (con: Connection) => {
            props.widgetManager.add('databases', { connections: [con.name], nameFilter: null });
         };

         return { connections, newConnection, isNewValid, addConnection, isSaving, confirmDelete, deleteConnection, openDatabases };
      },
   });
</script>
