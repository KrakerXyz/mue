
   export interface WidgetStyle {
      zIndex: number;
      left?: string;
      top?: string;
      width?: string;
      height?: string;
   }

   export interface Widget {
      id: string;
      component: string;
      props: Record<string, any>;
      style: WidgetStyle;
      maximized: boolean;
   }

   export interface WorkspaceState {
      widgets: Widget[];
   }