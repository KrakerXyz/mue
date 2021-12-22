<template>
   <div id="app-wrapper" class="vh-100 d-flex flex-column overflow-hidden">
      <v-header :widgetManager="manager"></v-header>
      <div class="flex-grow-1 position-relative overflow-hidden">
         <v-workspace v-if="manager" :widgetManager="manager"></v-workspace>
      </div>
   </div>
</template>

<script lang="ts">
   import { toPromise, useConnections, useSelectedWorkspaceId, useWorkspaces, useWs, WidgetManager } from '@/services';
   import { ReadStream } from 'fs';
   import { v4 } from 'uuid';
   import { computed, defineComponent, ref, watch } from 'vue';
   import HeaderVue from './header/Header.vue';
   import Workspace from './Workspace.vue';
   export default defineComponent({
      components: {
         'v-header': HeaderVue,
         'v-workspace': Workspace,
      },
      setup() {
         const connections = useConnections();
         const ws = useWs();
         const workspaces = useWorkspaces();
         const selectedWorkspaceId = useSelectedWorkspaceId();
         const selectedWorkspace = computed(() => workspaces.value?.find((ws) => ws.id === selectedWorkspaceId.value));
         const manager = ref<WidgetManager>();

         console.log('Starting fetch');
         fetch('/api/test').then(async (res) => {
            const reader = res.body?.getReader();
            if (!reader) {
               console.log('Empty body');
               return;
            }
            const decoder = new TextDecoder();
            let readResult = await reader.read();
            while (!readResult.done) {
               const chunk = decoder.decode(readResult.value);

               console.log('chunk', chunk);

               await new Promise((r) => setTimeout(r, 5000));

               readResult = await reader.read();
            }

            console.log('Read done');
         });

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
