<template>
   <div id="app-wrapper" class="vh-100 d-flex flex-column overflow-hidden">
      <v-header :widgetManager="manager"></v-header>
      <div class="flex-grow-1 position-relative overflow-hidden">
         <v-workspace v-if="manager" :widgetManager="manager"></v-workspace>
      </div>
   </div>
</template>

<script lang="ts">
   import { useConnections, useRpc, useSelectedWorkspaceId, useWorkspaces, WidgetManager } from '@/services';
   import { Workspace } from '@core/models';
   import { v4 } from 'uuid';
   import { computed, defineComponent, ref, watch } from 'vue';
   import HeaderVue from './header/Header.vue';
   import WorkspaceVue from './Workspace.vue';
   export default defineComponent({
      components: {
         'v-header': HeaderVue,
         'v-workspace': WorkspaceVue,
      },
      setup() {
         const connections = useConnections();
         const rpc = useRpc();
         const workspaces = useWorkspaces();
         const selectedWorkspaceId = useSelectedWorkspaceId();
         const selectedWorkspace = computed(() => workspaces.value?.find((ws) => ws.id === selectedWorkspaceId.value));
         const manager = ref<WidgetManager>();

         watch(
            [selectedWorkspace, workspaces],
            () => {
               if (!workspaces.value) {
                  return;
               }
               if (workspaces.value.length === 0) {
                  const newWorkspace: Workspace = { id: v4(), name: 'Default Workspace', description: '' };
                  rpc.configWorkspacePut(newWorkspace);
                  return;
               }

               if (!selectedWorkspaceId.value) {
                  selectedWorkspaceId.value = workspaces.value[0].id;
                  return;
               }

               if (selectedWorkspaceId.value === manager.value?.workspaceId) {
                  return;
               }

               manager.value = new WidgetManager(selectedWorkspaceId.value);

               const consWatchStop = watch(
                  connections,
                  (cons) => {
                     if (!cons) {
                        return;
                     }
                     const thisManager = manager.value;
                     if (!thisManager) {
                        return;
                     }
                     if (!cons.length) {
                        thisManager.add('connections', undefined);
                     } else {
                        thisManager.loadState(thisManager.workspaceId);
                     }
                     setTimeout(() => consWatchStop(), 10);
                  },
                  { immediate: true }
               );
            },
            { immediate: true }
         );

         return { manager };
      },
   });
</script>

<style lang="postcss" scoped="true">
   .navbar {
      -webkit-app-region: drag;
      height: 58px;
   }
</style>

<style lang="postcss">
   .text-orange {
      color: var(--bs-orange);
   }

   .clickable {
      cursor: pointer;
   }
</style>
