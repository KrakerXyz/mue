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
               <div class="row g-2">
                  <div class="col">{{ w.workspace.name }}</div>
                  <template v-if="!w.isEditing">
                     <div class="col-auto">
                        <button class="btn p-0" @click="setEdit(w)"><i class="fal fa-edit"></i></button>
                     </div>
                     <div class="col-auto">
                        <button class="btn p-0 text-danger" @click="confirmDelete = w"><i class="fal fa-trash-alt"></i></button>
                     </div>
                  </template>
                  <template v-else>
                     <div class="col-auto">
                        <button class="btn p-0 text-success"><i class="fal fa-save"></i></button>
                     </div>
                     <div class="col-auto">
                        <button class="btn p-0" @click="setEdit(null)"><i class="fal fa-times-square"></i></button>
                     </div>
                  </template>
               </div>
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
   import { useWorkspaces, WidgetManager } from '@/services';
   import { Widget, Workspace } from '@core/models';
   import { deepClone } from '@core/util';

   export default defineComponent({
      props: {
         widget: { type: Object as () => Widget, required: true },
         widgetManager: { type: Object as () => WidgetManager, required: true },
      },
      setup() {
         const workspaces = useWorkspaces();

         const workspaceVms = computed(() => {
            return workspaces.value?.map((ws) => {
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
            if (!confirmDelete.value || !workspaces.value) {
               return;
            }
            confirmDelete.value = undefined;
         };

         return { workspaceVms, confirmDelete, deleteWorkspace, setEdit };
      },
   });

   interface WorkspaceVm {
      workspace: Workspace;
      isEditing: boolean;
   }
</script>
