import { Favorites } from '@core/models';
import { deepEquals, deepFreeze } from '@core/util';
import { computed, ref, Ref } from 'vue';
import { useWs } from '.';

let favorites: Ref<Favorites | undefined> | undefined;

export function useFavorites(): Ref<Readonly<Favorites> | undefined> {

   if (favorites) { return favorites; }

   const localFavorites = ref<Favorites>();
   const thisFavorites = computed<Favorites | undefined>({
      get() { return localFavorites.value; },
      set(value: Favorites | undefined) {
         if (!value) { console.error('Do not set favorites to undefined'); return; }
         if (deepEquals(value, localFavorites.value)) { return; }
         localFavorites.value = value;
         ws.command({
            name: 'command.config.favorites.update',
            favorites: value
         });
      }
   });

   favorites = thisFavorites;

   const ws = useWs();
   const obs = ws.subscribe({
      name: 'subscription.config.favorites'
   });
   obs.subscribe(f => thisFavorites.value = deepFreeze(f));

   return thisFavorites;

}