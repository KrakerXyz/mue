import { Favorites } from "../models";

export type FavoritesUpdateCommand = {
  name: "command.config.favorites.update";
  favorites: Favorites;
};

export type ConfigCommand = FavoritesUpdateCommand;
