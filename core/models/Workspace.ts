import { Widget } from "./index.js";

export interface Workspace {
  id: string;
  name: string;
  description: string;
}

export interface WorkspaceState {
  widgets: Widget[];
}
