import { Favorites, WorkspaceState } from "../models";

export type WorkspaceStateSubscription = {
  name: "subscription.config.workspaces.state";
  workspaceId: string;
};
export type WorkspaceStateData = WorkspaceState;

export type FavoritesSubscription = {
  name: "subscription.config.favorites";
};

export type FavoritesData = Favorites;

export type ConfigSubscription =
  | WorkspaceStateSubscription
  | FavoritesSubscription;

export type ConfigSubscriptionDataType<
  TSubscription extends ConfigSubscription
> = TSubscription extends WorkspaceStateSubscription
  ? WorkspaceStateData
  : TSubscription extends FavoritesSubscription
  ? FavoritesData
  : never;
