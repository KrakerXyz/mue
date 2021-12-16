import { Widget } from '.';

export interface Workspace {
   id: string;
   name: string;
   description: string;
}

export interface WorkspaceState {
   widgets: Widget[];
}