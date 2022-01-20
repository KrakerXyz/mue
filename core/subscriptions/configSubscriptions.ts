import { Connection, Favorites, Workspace, WorkspaceState } from "../models";

export type WorkspacesListSubscription = {
  name: "subscription.config.workspaces.list";
};

export type WorkspacesListData = { workspaces: Workspace[] };

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
  | WorkspacesListSubscription
  | FavoritesSubscription;

export type ConfigSubscriptionDataType<
  TSubscription extends ConfigSubscription
> = TSubscription extends WorkspaceStateSubscription
  ? WorkspaceStateData
  : TSubscription extends WorkspacesListSubscription
  ? WorkspacesListData
  : TSubscription extends FavoritesSubscription
  ? FavoritesData
  : never;
