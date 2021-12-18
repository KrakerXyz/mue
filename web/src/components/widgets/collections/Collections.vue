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
   import { useFavorites, useSubscriptionRef, useWs, WidgetManager } from '@/services';
   import { computed, defineComponent, ref } from 'vue';
   import { Collection, Widget } from '@core/models';
   import CollectionItemVue from './CollectionItem.vue';

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
         const ws = useWs();
         const favorites = useFavorites();

         const isFavorite = (c: Collection) => {
            return favorites.value?.collections.some((x) => x.name === c.name && x.connection === props.connection && x.database === props.database);
         };

         const collectionSort = (a: Collection, b: Collection): number => {
            const aFav = isFavorite(a);
            const bFav = isFavorite(b);
            if (aFav && !bFav) {
               return -1;
            }
            if (!aFav && bFav) {
               return 1;
            }
            return a.name.localeCompare(b.name);
         };

         const cols = useSubscriptionRef(
            ws
               .subscribe({
                  name: 'subscription.mongo.database.collections.list',
                  connection: props.connection,
                  database: props.database,
               })
               .map((r) => r.collections)
         );

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
