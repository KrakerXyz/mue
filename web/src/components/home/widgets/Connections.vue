<template>
   <v-workspace-widget>
      <template #header-icon>
         <i class="fal fa-ethernet fa-fw fa-3x"></i>
      </template>
      <template #header>
         <h4 class="mb-0">Connections</h4>
      </template>

      <template #body>
         <div v-if="connections" class="list-group list-group-flush h-100 overflow-auto">
            <div class="list-group-item list-group-item-action" v-for="con of connections" :key="con.name">
               <div class="row g-2">
                  <div class="col-auto">
                     <span class="badge bg-primary">{{ con.name }}</span>
                  </div>
                  <div class="col text-muted small font-monospace text-truncate d-flex align-items-center">{{ con.connectionString }}</div>
                  <div class="col-auto">
                     <button class="btn p-0 text-danger" @click="confirmDelete = con"><i class="fal fa-trash-alt"></i></button>
                  </div>
               </div>
            </div>
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
            Are you sure you want to delete <span class="badge bg-primary me-2">Prod1</span>?
         </v-confirmation-modal>
      </template>
   </v-workspace-widget>
</template>

<script lang="ts">
   import { useConnections, useWs } from '@/services';
   import { Connection } from '@core/models';
   import { computed, defineComponent, reactive, ref } from 'vue';

   export default defineComponent({
      props: {},
      setup() {
         const ws = useWs();

         const connections = useConnections();

         const newConnection = reactive<Connection>({ name: '', connectionString: 'mongodb+srv://' });

         const isNewValid = computed(
            () =>
               newConnection.name &&
               newConnection.connectionString.startsWith('mongodb+srv://') &&
               newConnection.connectionString.replaceAll('mongodb+srv://', '')
         );

         const isSaving = ref(false);
         const addConnection = async () => {
            isSaving.value = true;
            const copy = [...(connections.value ?? []), { ...newConnection }];
            await ws.command({
               name: 'command.config.connections.update',
               connections: copy,
            });
            newConnection.name = '';
            newConnection.connectionString = 'mongodb+srv://';
            isSaving.value = false;
         };

         const confirmDelete = ref<Connection>();
         const deleteConnection = async () => {
            if (!confirmDelete.value || !connections.value) {
               return;
            }
            const newConnections = connections.value.filter((c) => c !== confirmDelete.value);
            await ws.command({
               name: 'command.config.connections.update',
               connections: newConnections,
            });
            confirmDelete.value = undefined;
         };

         return { connections, newConnection, isNewValid, addConnection, isSaving, confirmDelete, deleteConnection };
      },
   });
</script>
