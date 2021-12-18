<template>
   <li class="nav-item position-relative" v-if="hasFavorites">
      <span class="nav-link"><i class="fas fa-star me-2"></i>Favorites </span>
      <div class="hover d-none position-absolute text-white bg-dark p-2 shadow border-top border-light">
         <h5>Collections</h5>
         <div class="list-group list-group-flush">
            <div
               class="list-group-item bg-dark text-white border-white"
               v-for="(c, index) of favorites.collections"
               :key="index"
               role="button"
               @click="openCollectionFav(c)"
            >
               {{ c.name }}
            </div>
         </div>
      </div>
   </li>
</template>

<script lang="ts">
   import { CollectionFavorite, defaultFavorites } from '@core/models';
   import { useFavorites, WidgetManager } from '@/services';
   import { computed, defineComponent } from 'vue';

   export default defineComponent({
      props: {
         widgetManager: { type: Object as () => WidgetManager, required: true },
      },
      setup(props) {
         const favoritesRaw = useFavorites();
         const favorites = computed(() => favoritesRaw.value ?? defaultFavorites);

         const hasFavorites = computed(() => !!favorites.value?.collections.length);

         const openCollectionFav = (c: CollectionFavorite) => {
            props.widgetManager.add('query', {
               collection: c.name,
               connection: c.connection,
               database: c.database,
            });
         };

         return { favorites, hasFavorites, openCollectionFav };
      },
   });
</script>

<style lang="postcss" scoped>
   .nav-item:hover {
      .border-light {
         border-color: #555 !important;
      }

      & > .hover {
         display: block !important;
         z-index: 1000;
      }
   }
</style>
