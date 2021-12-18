<template>
   <button class="list-group-item list-group-item-action font-monospace" @click="openQuery(collection)">
      <div class="row g-2">
         <div class="col">{{ collection.name }}</div>
         <div class="col-auto" v-if="favoriteIndex !== undefined">
            <button class="btn p-0" @click.stop="toggleFavorite()">
               <span v-if="favoriteIndex !== -1"><i class="fas fa-star"></i></span>
               <span v-else><i class="fal fa-star"></i></span>
            </button>
         </div>
      </div>
   </button>
</template>

<script lang="ts">
   import { computed, defineComponent } from 'vue';
   import { Collection } from '@core/models';
   import { useFavorites, WidgetManager } from '@/services';
   import { deepClone } from '@core/util';

   export default defineComponent({
      props: {
         collection: { type: Object as () => Collection, required: true },
         connection: { type: String, required: true },
         database: { type: String, required: true },
         widgetManager: { type: Object as () => WidgetManager, required: true },
      },
      setup(props) {
         const openQuery = (c: Collection) => {
            props.widgetManager.add('query', {
               connection: props.connection,
               database: props.database,
               collection: c.name,
            } as any);
         };

         const favorites = useFavorites();

         const favoriteIndex = computed(() =>
            favorites.value?.collections.findIndex(
               (fc) => fc.name === props.collection.name && fc.connection === props.connection && fc.database === props.database
            )
         );

         const toggleFavorite = () => {
            if (!favorites.value || favoriteIndex.value === undefined) {
               return;
            }

            const copy = deepClone(favorites.value);
            if (favoriteIndex.value !== -1) {
               copy.collections.splice(favoriteIndex.value, 1);
            } else {
               copy.collections.push({ name: props.collection.name, connection: props.connection, database: props.database });
            }

            favorites.value = copy;
         };

         return { openQuery, favoriteIndex, toggleFavorite };
      },
   });
</script>
