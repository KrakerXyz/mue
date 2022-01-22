import { Widget, WidgetName, WidgetProps } from '@core/models';
import { ListItemType, Subscription } from '@core/RpcService.js';
import { deepClone } from '@core/util/deepClone.js';
import { deepEquals } from '@core/util/deepEquals.js';
import { v4 } from 'uuid';
import { reactive } from 'vue';
import { useRpc } from './rpc.js';

export class WidgetManager {
   private readonly _rpc = useRpc();
   private readonly _widgets = reactive<Widget[]>([]);

   public constructor(public readonly workspaceId: string) {}

   public get widgets() {
      return this._widgets;
   }

   public add<TName extends WidgetName>(name: TName, props: WidgetProps<TName>) {
      const widget: Widget<TName> = {
         id: v4(),
         workspaceId: this.workspaceId,
         component: {
            name,
            props,
         },
         workspace: {
            maximized: false,
            style: {
               top: `${this._widgets.length * 40 + 5}px`,
               left: `${this._widgets.length * 40 + 5}px`,
               height: '50%',
               width: '50%',
               zIndex: 0,
            },
         },
      };

      //The caller is probably coming from some click event which will mean it's bringToFront would get called after we return from here. As such, call a bringToFront on next tick so we override it
      setTimeout(() => {
         this._widgets.push(widget);
         this.bringToFront(widget);
         if (!widget.workspace.maximized && this._widgets.some((w) => w.workspace.maximized)) {
            this.toggleMaximized(widget);
         }
         this.saveState();
      });
   }

   public readonly remove = (widget: Widget) => {
      const existingIndex = this._widgets.indexOf(widget);
      if (existingIndex === -1) {
         console.error('Widget does not exist');
         return;
      }
      this._widgets.splice(existingIndex, 1);
      this.saveState();
   };

   public updateProps<TName extends WidgetName>(w: Widget<TName>, props: Partial<WidgetProps<TName>>) {
      if (!w.component.props) {
         w.component.props = {} as WidgetProps<TName>;
      }
      Object.assign(w.component.props, props);
      this.saveState();
   }

   public bringToFront(w: Widget) {
      const maxIndex = this._widgets.reduce((p, c) => Math.max(p, c.workspace.style.zIndex), 0);
      if (maxIndex && maxIndex === w.workspace.style.zIndex) {
         return;
      }
      w.workspace.style.zIndex = maxIndex + 1;
      const sorted = [...this._widgets].sort((a, b) => a.workspace.style.zIndex - b.workspace.style.zIndex);
      for (let i = 0; i < sorted.length; i++) {
         sorted[i].workspace.style.zIndex = i;
      }
      this.saveState();
   }

   public toggleMaximized(widget: Widget) {
      widget.workspace.maximized = !widget.workspace.maximized;
      this.bringToFront(widget);
      this.saveState();
   }

   public readonly setPosition = (w: Widget, rect: { left?: number; top?: number; width?: number; height?: number }) => {
      Object.getOwnPropertyNames(rect).map((p) => {
         const v = (rect as any)[p];
         if (v === undefined) {
            return;
         }
         const css = `${v}px`;
         (w.workspace.style as any)[p] = css;
      });
      this.saveState();
   };

   private _widgetSubscription: Subscription | null = null;
   public async loadState(workspaceId: string) {
      this._widgets.splice(0, this._widgets.length);

      if (this._widgetSubscription) {
         this._widgetSubscription();
      }

      this._widgetSubscription = this._rpc.configWorkspaceWidgetList(workspaceId, (w) => {
         for (const w of this._widgets) {
            if (!w.workspace.style.width) {
               w.workspace.style.width = '50%';
            }
            if (!w.workspace.style.height) {
               w.workspace.style.height = '50%';
            }
         }

         if (w.type === ListItemType.InitialEmpty) {
            return;
         }
         const existingIndex = this._widgets.findIndex((x) => x.id === w.item.id);
         if (w.type === ListItemType.Delete) {
            if (existingIndex === -1) {
               return;
            }
         } else if (existingIndex === -1) {
            this._widgets.push(w.item);
         } else {
            this._widgets.splice(existingIndex, 1, w.item);
         }
      });
   }

   // eslint-disable-next-line no-undef
   private _updateStateThrottle: NodeJS.Timeout | null = null;
   private _widgetsSnapshot: Widget[] | null = null;
   private saveState() {
      if (this._updateStateThrottle) {
         clearTimeout(this._updateStateThrottle);
      }
      if (!this._widgetsSnapshot) {
         this._widgetsSnapshot = deepClone(this.widgets);
      }
      this._updateStateThrottle = setTimeout(async () => {
         this._updateStateThrottle = null;
         for (const sw of this._widgetsSnapshot ?? []) {
            const w = this._widgets.find((x) => x.id === sw.id);
            if (!w) {
               this._rpc.configWorkspaceWidgetDelete(sw);
            } else if (!deepEquals(sw, w)) {
               this._rpc.configWorkspaceWidgetPut(w);
            }
         }

         //Checking for new widgets
         for (const w of this._widgets) {
            const sw = this._widgetsSnapshot?.find((x) => x.id === w.id);
            if (sw) {
               continue;
            }
            this._rpc.configWorkspaceWidgetPut(w);
         }
         this._widgetsSnapshot = deepClone(this._widgets);
      }, 500);
   }
}
