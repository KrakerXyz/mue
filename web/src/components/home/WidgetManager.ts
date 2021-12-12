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

   public add(component: 'databases' | 'query' | 'collections', props: Record<string, any>) {
      const newWidget: Widget = {
         id: v4(),
         component,
         props,
         style: {
            top: `${this._widgets.value.length * 40 + 5}px`,
            left: `${this._widgets.value.length * 40 + 5}px`,
            height: '50%',
            width: '50%',
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
      if (maxIndex && maxIndex === w.style.zIndex) { return; }
      w.style.zIndex = maxIndex + 1;
      const sorted = [...this._widgets.value].sort((a, b) => a.style.zIndex - b.style.zIndex);
      for (let i = 0; i < sorted.length; i++) {
         sorted[i].style.zIndex = i;
      }
      this.updateState();
   };

   public readonly setPosition = (w: Widget, x: number, y: number) => {
      if (x < 0) { x = 0; }
      if (y < 0) { y = 0; }
      if (x + 70 > window.innerWidth) { return; }
      const newX = `${x}px`;
      const newY = `${y}px`;
      if (newX === w.style.left && newY === w.style.top) { return; }
      w.style.left = newX;
      w.style.top = newY;
      this.updateState();
   };

   public readonly setState = (state: WorkspaceState) => {
      this._widgets.value = state.widgets;
      let updated = false;
      for (const w of this._widgets.value) {
         if (!w.style.width) { w.style.width = '50%'; updated = true; }
         if (!w.style.height) { w.style.height = '50%'; updated = true; }
      }
      if (updated) {
         this.updateState();
      }
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
      }, 2000);
   }

   public readonly updateProps = (w: Widget, props: Record<string, any>) => {
      Object.assign(w.props, props);
      this.updateState();
   };
}