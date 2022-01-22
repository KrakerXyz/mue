<template>
   <div class="navbar navbar-expand navbar-dark bg-dark">
      <div class="container-fluid">
         <ul class="navbar-nav">
            <template v-if="widgetManager && selectedWorkspace">
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
               <v-favorites-nav-item :widget-manager="widgetManager"></v-favorites-nav-item>
            </template>
         </ul>
      </div>
   </div>
</template>

<script lang="ts">
   import { useWorkspaces, WidgetManager, useSelectedWorkspaceId, useConnections } from '@/services';
   import { computed, defineComponent, toRef } from 'vue';
   import FavoritesNavItemVue from './FavoritesNavItem.vue';

   export default defineComponent({
      components: {
         'v-favorites-nav-item': FavoritesNavItemVue,
      },
      props: {
         widgetManager: { type: Object as () => WidgetManager },
      },
      setup(props) {
         const manager = toRef(props, 'widgetManager');
         const connections = useConnections();
         const hasConnections = computed(() => !!connections.value?.length);
         const workspaces = useWorkspaces();
         const selectedWorkspaceId = useSelectedWorkspaceId();
         const selectedWorkspace = computed(() => workspaces.value?.find((ws) => ws.id === selectedWorkspaceId.value));

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
         return { openWidget, selectedWorkspace, hasConnections };
      },
   });
</script>
