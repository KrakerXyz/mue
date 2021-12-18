import { QueryWidgetResultContext } from '.';

export interface WidgetStyle {
   zIndex: number;
   left?: string;
   top?: string;
   width?: string;
   height?: string;
}

export type WidgetName = 'connections' | 'databases' | 'collections' | 'query' | 'workspaces';

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
   ? {
      connections: string[] | null,
      nameFilter: string | null
   }
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
   : TName extends 'workspaces'
   ? undefined
   : never;
