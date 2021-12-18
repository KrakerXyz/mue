
export interface Favorites {
   collections: CollectionFavorite[];
}

export const defaultFavorites: Favorites = {
   collections: []
};

export interface CollectionFavorite {
   name: string;
   database: string;
   connection: string;
}