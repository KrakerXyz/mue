import { Favorites, WorkspaceState } from "../models";

export type FavoritesSubscription = {
  name: "subscription.config.favorites";
};

export type FavoritesData = Favorites;

export type ConfigSubscription = FavoritesSubscription;

export type ConfigSubscriptionDataType<
  TSubscription extends ConfigSubscription
> = TSubscription extends FavoritesSubscription ? FavoritesData : never;
