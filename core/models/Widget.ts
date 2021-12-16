import { QueryWidgetResultContext } from '.';

export interface WidgetStyle {
   zIndex: number;
   left?: string;
   top?: string;
   width?: string;
   height?: string;
}

export type WidgetName = 'connections' | 'databases' | 'collections' | 'query';

export interface Widget<TName extends WidgetName = any> {
   id: string;
   component: {
      name: TName,
      props: WidgetProps<TName>
   };
   workspace: {
      style: WidgetStyle;
      maximized: boolean;
   }
}

export type WidgetProps<TName extends WidgetName> =
   TName extends 'connections'
   ? undefined
   : TName extends 'databases'
   ? undefined
   : TName extends 'collections'
   ? {
      connection: string;
      database: string;
   }
   : TName extends 'query'
   ? {
      connection: string;
      database: string;
      collection: string;
      query?: string;
      resultContext?: QueryWidgetResultContext;
   }
   : never;

export interface WorkspaceState {
   widgets: Widget[];
}