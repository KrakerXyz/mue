import { useWs } from '@/services';
import { Widget, WorkspaceState } from '@core/models';
import { v4 } from 'uuid';
import { ref } from 'vue';

export class WidgetManager {
   public static readonly INJECT = Symbol('Widget Manager');
   private readonly _ws: ReturnType<typeof useWs>;

   public constructor() {
      this._ws = useWs();
   }

   private readonly _widgets = ref<Widget[]>([]);

   public get widgets() {
      return this._widgets;
   }

   public add(component: string, props: Record<string, any>) {
      const newWidget: Widget = {
         id: v4(),
         component,
         props,
         style: {
            top: `${this._widgets.value.length * 40 + 5}px`,
            left: `${this._widgets.value.length * 40 + 5}px`,
            zIndex: 0,
         },
         maximized: false,
      };

      setTimeout(() => {
         this.bringToFront(newWidget);
         this._widgets.value = [...this._widgets.value, newWidget];
         this.updateState();
      });
   }

   public readonly remove = (widget: Widget) => {
      const existingIndex = this._widgets.value.indexOf(widget);
      if (existingIndex === -1) {
         console.error(`Widget with id ${widget.id} was not present`);
         return;
      }
      const newWidgets = [...this._widgets.value];
      newWidgets.splice(existingIndex, 1);
      this._widgets.value = newWidgets;
      this.updateState();
   };

   public readonly toggleMaximized = (widget: Widget) => {
      this.bringToFront(widget);

      widget.maximized = !widget.maximized;
      this.updateState();
   };

   public readonly bringToFront = (w: Widget) => {
      const maxIndex = this._widgets.value.reduce((p, c) => Math.max(p, c.style.zIndex), 0);
      if (maxIndex === w.style.zIndex) { return; }
      w.style.zIndex = maxIndex + 1;
      this.updateState();
   };

   public readonly setState = (state: WorkspaceState) => {
      this._widgets.value = state.widgets;
   };

   // eslint-disable-next-line no-undef
   private _updateStateThrottle: NodeJS.Timeout | null = null;
   private updateState() {
      if (this._updateStateThrottle) {
         clearTimeout(this._updateStateThrottle);
      }
      this._updateStateThrottle = setTimeout(() => {
         this._updateStateThrottle = null;
         this._ws.command({
            name: 'command.config.workspace.state.update',
            state: {
               widgets: this._widgets.value,
            },
         });
      }, 3000);
   }

   public readonly updateProps = (w: Widget, props: Record<string, any>) => {
      Object.assign(w.props, props);
      this.updateState();
   };
}