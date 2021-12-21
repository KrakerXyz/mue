import { deepFreeze } from '@core/util';

export interface Favorites {
   collections: CollectionFavorite[];
}

export const defaultFavorites: Favorites = deepFreeze({
   collections: []
});

export interface CollectionFavorite {
   name: string;
   database: string;
   connection: string;
}