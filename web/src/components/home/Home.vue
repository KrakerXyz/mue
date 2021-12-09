<template>
   <div class="container-fluid h-100 p-3">
      <div class="row h-100">
         <div class="h-100 col-3">
            <databases @selected="dbSelected($event)"></databases>
         </div>

         <div class="col">Content</div>
      </div>
   </div>
</template>

<script lang="ts">
   import { defineComponent } from 'vue';
   import Databases, { SelectedDatabase } from './Databases.vue';
   import { useWs } from '@/services';

   export default defineComponent({
      props: {},
      setup() {
         const ws = useWs();
         const dbSelected = async (db: SelectedDatabase) => {
            const cols = await ws.send({
               command: 'mongo.database.listCollections',
               connectionName: db.connectionName,
               databaseName: db.databaseName,
            });
            console.log(cols.data);
         };

         return { dbSelected };
      },
      components: { Databases },
   });
</script>
