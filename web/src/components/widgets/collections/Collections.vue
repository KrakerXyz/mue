<template>
   <v-widget-template :widget="widget" :widgetManager="widgetManager">
      <template #header-icon>
         <i class="fal fa-layer-group fa-fw fa-3x"></i>
      </template>
      <template #header>
         <div class="row g-2 align-items-center">
            <div class="col-auto">
               <h4 class="mb-0">Collections: {{ database }}</h4>
            </div>
            <div class="col-auto">
               <v-connection-badge :name="connection"></v-connection-badge>
            </div>
         </div>
      </template>
      <template #header2>
         <div class="row mt-2">
            <div class="col">
               <input class="form-control" v-model="nameFilter" placeholder="Filter" />
            </div>
         </div>
      </template>
      <template #body>
         <div v-if="filteredCols" class="list-group list-group-flush h-100 overflow-auto">
            <v-collection-item
               v-for="collection of filteredCols"
               :key="collection.name"
               v-bind="{ connection, database, widgetManager, collection }"
            ></v-collection-item>
         </div>
      </template>
   </v-widget-template>
</template>

<script lang="ts">
   import { useRpc, WidgetManager } from '@/services';
   import { computed, defineComponent, onUnmounted, ref } from 'vue';
   import { Collection, Widget } from '@core/models';
   import CollectionItemVue from './CollectionItem.vue';
   import { ListItemType } from '@core/RpcService';

   export default defineComponent({
      components: {
         'v-collection-item': CollectionItemVue,
      },
      props: {
         connection: { type: String, required: true },
         database: { type: String, required: true },
         widget: { type: Object as () => Widget, required: true },
         widgetManager: { type: Object as () => WidgetManager, required: true },
      },
      setup(props) {
         const rpc = useRpc();

         const collectionSort = (a: Collection, b: Collection): number => {
            return a.name.localeCompare(b.name);
         };

         const cols = ref<Collection[]>();

         const colSubscription = rpc.mongoCollectionList(props.connection, props.database, (listItem) => {
            if (listItem.type === ListItemType.InitialEmpty) {
               cols.value = [];
               return;
            }

            const newArr = [...(cols.value ?? [])];
            const existingIndex = newArr.findIndex((c) => c.name === listItem.item.name);
            if (listItem.type === ListItemType.Delete) {
               if (existingIndex === -1) {
                  console.warn('Deleted collections does not exist');
                  return;
               }
               newArr.splice(existingIndex, 1);
            } else if (existingIndex !== -1) {
               newArr.splice(existingIndex, 1, listItem.item);
            } else {
               newArr.push(listItem.item);
               newArr.sort((a, b) => a.name.localeCompare(b.name));
            }
            cols.value = newArr;
         });

         onUnmounted(() => Promise.resolve(colSubscription).then((sub) => sub()));

         const nameFilter = ref<string>();

         const filteredCols = computed(() => {
            if (!cols.value) {
               return cols.value;
            }
            let x = cols.value;
            if (nameFilter.value) {
               const lowerName = nameFilter.value.toLocaleLowerCase();
               x = x.filter((c) => c.name.toLocaleLowerCase().includes(lowerName));
            }
            return x.sort(collectionSort);
         });

         return { filteredCols, nameFilter };
      },
   });
</script>
