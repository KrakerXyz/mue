<template>
   <v-widget-template :widget="widget" :widgetManager="widgetManager">
      <template #header-icon>
         <i class="fal fa-window-restore fa-fw fa-3x"></i>
      </template>
      <template #header>
         <h4 class="mb-0">Workspaces</h4>
      </template>
      <template #body>
         <div v-if="workspaceVms" class="list-group list-group-flush h-100 overflow-auto">
            <div class="list-group-item" v-for="w of workspaceVms" :key="w.workspace.id">
               <div class="row g-2 align-items-center" v-if="!w.isEditing">
                  <div class="col-auto">
                     <a :href="`/${w.workspace.id}`" target="_blank"><i class="fal fa-external-link"></i></a>
                  </div>
                  <div class="col fw-bold" v-if="w.workspace.id === selectedWorkspaceId">{{ w.workspace.name }}</div>
                  <div class="col" v-if="w.workspace.id !== selectedWorkspaceId">
                     <button class="btn btn-link p-0" @click.passive="selectedWorkspaceId = w.workspace.id">{{ w.workspace.name }}</button>
                  </div>
                  <div class="col-auto">
                     <button class="btn p-0" @click="setEdit(w)"><i class="fal fa-edit"></i></button>
                  </div>
                  <div class="col-auto">
                     <button class="btn p-0 text-danger" @click="confirmDelete = w"><i class="fal fa-trash-alt"></i></button>
                  </div>
               </div>
               <div class="row g-2" v-else>
                  <div class="col">
                     <input class="form-control" v-model="w.workspace.name" />
                  </div>
                  <div class="col-auto">
                     <button class="btn p-0 text-success" @click="saveEdit()"><i class="fal fa-save"></i></button>
                  </div>
                  <div class="col-auto">
                     <button class="btn p-0" @click="setEdit(null)"><i class="fal fa-times-square"></i></button>
                  </div>
               </div>
            </div>
            <div class="list-group-item">
               <h5 class="mt-2">New Workspace</h5>
               <form class="row g-2" @submit.prevent="saveNew()">
                  <div class="col">
                     <div class="form-floating">
                        <input id="new-name" class="form-control" placeholder="*" v-model="newWorkspace.workspace.name" />
                        <label for="new-name">Name</label>
                     </div>
                  </div>
                  <div class="col-auto">
                     <button class="btn btn-primary h-100" :disabled="!isNewValid">Add</button>
                  </div>
               </form>
            </div>
         </div>
         <v-confirmation-modal v-if="confirmDelete" @cancel="confirmDelete = undefined" @confirm="deleteWorkspace()">
            <h3>Confirm Delete</h3>
            Are you sure you want to delete the '{{ confirmDelete.workspace.name }}' workspace?
         </v-confirmation-modal>
      </template>
   </v-widget-template>
</template>

<script lang="ts">
   import { computed, defineComponent, reactive, ref } from 'vue';
   import { useRpc, useSelectedWorkspaceId, useWorkspaces, WidgetManager } from '@/services';
   import { Widget, Workspace } from '@core/models';
   import { deepClone } from '@core/util';
   import { v4 } from 'uuid';

   export default defineComponent({
      props: {
         widget: { type: Object as () => Widget, required: true },
         widgetManager: { type: Object as () => WidgetManager, required: true },
      },
      setup() {
         const workspaces = useWorkspaces();
         const rpc = useRpc();
         const selectedWorkspaceId = useSelectedWorkspaceId();

         const workspaceVms = computed(() => {
            return [...(workspaces.value ?? [])]
               .sort((a, b) => a.name.localeCompare(b.name))
               .map((ws) => {
                  const vm: WorkspaceVm = reactive({
                     workspace: deepClone(ws),
                     isEditing: false,
                  });
                  return vm;
               });
         });

         const setEdit = (w: WorkspaceVm | null) => {
            workspaceVms.value?.forEach((vm) => (vm.isEditing = false));
            if (!w) {
               return;
            }
            w.isEditing = true;
         };

         const confirmDelete = ref<WorkspaceVm>();
         const deleteWorkspace = async () => {
            if (!confirmDelete.value || !workspaceVms.value) {
               return;
            }
            const index = workspaceVms.value.findIndex((w) => w.workspace.id === confirmDelete.value?.workspace.id);
            if (index === -1) {
               return;
            }
            workspaceVms.value.splice(index, 1);
            rpc.configWorkspaceDelete(confirmDelete.value.workspace);
            setEdit(null);
            confirmDelete.value = undefined;
         };

         const newWorkspace = ref<WorkspaceVm>(
            reactive({
               isEditing: false,
               workspace: {
                  id: v4(),
                  name: '',
                  description: '',
               },
            })
         );

         const isNewValid = computed(() => !!newWorkspace.value.workspace.name);

         const saveNew = () => {
            if (!isNewValid.value) {
               return;
            }
            if (!workspaceVms.value) {
               return;
            }
            workspaceVms.value.push(deepClone(newWorkspace.value));
            rpc.configWorkspacePut(newWorkspace.value.workspace);
            setEdit(null);
            newWorkspace.value = reactive({
               isEditing: false,
               workspace: {
                  id: v4(),
                  name: '',
                  description: '',
               },
            });
         };

         const saveEdit = () => {
            const editing = workspaceVms.value.find((w) => w.isEditing);
            if (!editing) {
               return;
            }
            rpc.configWorkspacePut(editing.workspace);
            setEdit(null);
         };

         return { workspaceVms, confirmDelete, deleteWorkspace, setEdit, newWorkspace, saveNew, isNewValid, selectedWorkspaceId, saveEdit };
      },
   });

   interface WorkspaceVm {
      workspace: Workspace;
      isEditing: boolean;
   }
</script>
