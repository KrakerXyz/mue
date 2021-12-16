<template>
   <div id="app-wrapper" class="vh-100 d-flex flex-column">
      <div class="navbar navbar-expand navbar-dark bg-dark sticky-top">
         <div class="container-fluid">
            <ul class="navbar-nav">
               <!-- <li class="nav-item">
                  <router-link class="nav-link" :to="{ name: 'home' }">Home</router-link>
               </li> -->
               <li class="nav-item">
                  <button class="btn btn-link nav-link" @click="openWidget('connections')"><i class="fal fa-ethernet fa-fw me-1"></i>Connections</button>
               </li>
               <li v-if="hasConnections" class="nav-item">
                  <button class="btn btn-link nav-link" @click="openWidget('databases')"><i class="fal fa-database fa-fw me-1"></i> Databases</button>
               </li>
            </ul>

            <span class="navbar-text">
               <span v-if="wsState.connected" class="text-success"><i class="fas fa-wifi fa-fw"></i></span>
               <span v-if="!wsState.connected" class="text-danger"><i class="fas fa-wifi-slash fa-fw"></i></span>
            </span>
         </div>
      </div>

      <div class="flex-grow-1 position-relative overflow-hidden">
         <v-workspace :widgetManager="manager"></v-workspace>
      </div>
   </div>
</template>

<script lang="ts">
   import { toPromise, useConnections, useWs, WidgetManager } from '@/services';
   import { computed, defineComponent, watch } from 'vue';
   import Workspace from './Workspace.vue';

   export default defineComponent({
      components: {
         'v-workspace': Workspace,
      },
      setup() {
         const manager = new WidgetManager();

         const ws = useWs();

         const connections = useConnections();

         const hasConnections = computed(() => !!connections.value?.length);

         const consWatchStop = watch(
            connections,
            (cons) => {
               if (!cons) {
                  return;
               }
               setTimeout(consWatchStop);
               if (!cons.length) {
                  manager.add('connections', undefined);
               } else {
                  const workspace$ = ws.subscribe({
                     name: 'subscription.config.workspace.state',
                  });

                  toPromise(workspace$).then((state) => {
                     manager.loadState(state);
                  });
               }
            },
            { immediate: true }
         );

         const openWidget = (widget: 'connections' | 'databases') => {
            manager.add(widget, undefined);
         };

         return { wsState: ws.state, openWidget, manager, hasConnections };
      },
   });
</script>

<style lang="postcss">
   .clickable {
      cursor: pointer;
   }
</style>

<style>
   .text-orange {
      color: var(--bs-orange);
   }
</style>
