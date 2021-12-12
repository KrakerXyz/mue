<template>
   <div id="app-wrapper" class="vh-100 d-flex flex-column">
      <div class="navbar navbar-expand navbar-dark bg-dark sticky-top">
         <div class="container-fluid">
            <ul class="navbar-nav">
               <!-- <li class="nav-item">
                  <router-link class="nav-link" :to="{ name: 'home' }">Home</router-link>
               </li> -->
               <li class="nav-item">
                  <button class="btn btn-link nav-link" @click="openDatabases()"><i class="fal fa-database fa-fw"></i> Databases</button>
               </li>
            </ul>

            <span class="navbar-text">
               <span v-if="wsState.connected" class="text-success"><i class="fas fa-wifi fa-fw"></i></span>
               <span v-if="!wsState.connected" class="text-danger"><i class="fas fa-wifi-slash fa-fw"></i></span>
            </span>
         </div>
      </div>

      <div class="flex-grow-1 position-relative overflow-hidden">
         <Suspense>
            <template #default>
               <router-view></router-view>
            </template>
            <template #fallback>
               <span>Loading...</span>
            </template>
         </Suspense>
      </div>
   </div>
</template>

<script lang="ts">
   import { useWs } from '@/services';
   import { defineComponent, provide } from 'vue';
   import { WidgetManager } from './home/WidgetManager';

   export default defineComponent({
      setup() {
         const manager = new WidgetManager();
         provide(WidgetManager.INJECT, manager);

         const ws = useWs();

         const openDatabases = () => {
            manager.add('databases', {});
         };

         return { wsState: ws.state, openDatabases };
      },
   });
</script>

<style lang="postcss">
   .clickable {
      cursor: pointer;
   }
</style>
