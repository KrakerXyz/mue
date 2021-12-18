<template>
   <div id="app-wrapper" class="vh-100 d-flex flex-column">
      <div class="navbar navbar-expand navbar-dark bg-dark sticky-top">
         <div class="container-fluid">
            <ul class="navbar-nav">
               <template v-if="manager && selectedWorkspace">
                  <li class="nav-item">
                     <button class="btn btn-link nav-link mb-0" @click="openWidget('workspaces')">
                        <h5 class="mb-0 text-white"><i class="fal fa-window-restore me-1"></i>{{ selectedWorkspace.name }}</h5>
                     </button>
                  </li>
                  <li class="nav-item">
                     <button class="btn btn-link nav-link" @click="openWidget('connections')"><i class="fal fa-ethernet fa-fw me-1"></i>Connections</button>
                  </li>
                  <li v-if="hasConnections" class="nav-item">
                     <button class="btn btn-link nav-link" @click="openWidget('databases')"><i class="fal fa-database fa-fw me-1"></i> Databases</button>
                  </li>
               </template>
            </ul>

            <span class="navbar-text">
               <span v-if="wsState.connected" class="text-success"><i class="fas fa-wifi fa-fw"></i></span>
               <span v-if="!wsState.connected" class="text-danger"><i class="fas fa-wifi-slash fa-fw"></i></span>
            </span>
         </div>
      </div>

      <div class="flex-grow-1 position-relative overflow-hidden">
         <v-workspace v-if="manager" :widgetManager="manager"></v-workspace>
      </div>
   </div>
</template>

<script lang="ts">
   import { toPromise, useConnections, useSelectedWorkspaceId, useWorkspaces, useWs, WidgetManager } from '@/services';
   import { v4 } from 'uuid';
   import { computed, defineComponent, ref, watch } from 'vue';
   import Workspace from './Workspace.vue';
   export default defineComponent({
      components: {
         'v-workspace': Workspace,
      },
      setup() {
         const connections = useConnections();
         const ws = useWs();
         const workspaces = useWorkspaces();
         const hasConnections = computed(() => !!connections.value?.length);
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
                  ws.command({
                     name: 'command.config.workspaces.update',
                     workspaces: [{ id: v4(), name: 'Default Workspace', description: '' }],
                  });
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
                        const workspace$ = ws.subscribe({
                           name: 'subscription.config.workspaces.state',
                           workspaceId: thisManager.workspaceId,
                        });

                        toPromise(workspace$).then((state) => {
                           thisManager.loadState(state);
                        });
                     }
                     setTimeout(() => consWatchStop(), 10);
                  },
                  { immediate: true }
               );
            },
            { immediate: true }
         );

         const openWidget = (widget: 'connections' | 'databases' | 'workspaces') => {
            if (!manager.value) {
               return;
            }

            const existing = manager.value.widgets.find((w) => w.component.name === widget);
            if (existing) {
               manager.value.bringToFront(existing);
            } else {
               manager.value.add(widget, undefined);
            }
         };

         return { wsState: ws.state, openWidget, manager, hasConnections, selectedWorkspace };
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
