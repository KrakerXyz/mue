<template>
   <div class="h-100 w-100 bg-secondary position-relative">
      <div
         class="position-absolute bg-white shadow col-5 h-25"
         :class="{ rounded: !w.maximized }"
         v-for="w of widgets"
         :key="w.id"
         :style="w.maximized ? { ...maximizedStyle, zIndex: w.style.zIndex } : w.style"
         @click="bringToFront(w)"
      >
         <component :is="w.component" v-bind="w.props" :widget="w"></component>
      </div>
   </div>
</template>

<script lang="ts">
   import { v4 } from 'uuid';
   import { Component, defineComponent, inject, markRaw, ref } from 'vue';

   export default defineComponent({
      setup() {
         const manager = inject<WidgetManager>(WidgetManager.INJECT);
         if (!manager) {
            throw new Error('WidgetManager instance not registered');
         }

         const maximizedStyle: WidgetStyle = {
            zIndex: 0,
            height: '100% !important',
            width: '100% !important',
         };

         return { widgets: manager.widgets, bringToFront: manager.bringToFront, maximizedStyle };
      },
   });

   interface WidgetStyle {
      zIndex: number;
      left?: string;
      top?: string;
      width?: string;
      height?: string;
   }

   export interface Widget<TProps = any, T extends Component<TProps> = Component> {
      id: string;
      component: T;
      props: TProps;
      style: WidgetStyle;
      maximized: boolean;
   }

   export class WidgetManager {
      public static readonly INJECT = Symbol('Widget Manager');

      private readonly _widgets = ref<Widget[]>([]);

      public get widgets() {
         return this._widgets;
      }

      public add<TProps>(component: Component<TProps>, props: TProps) {
         const newWidget: Widget = {
            id: v4(),
            component: markRaw(component),
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
      };

      public readonly toggleMaximized = (widget: Widget) => {
         this.bringToFront(widget);

         widget.maximized = !widget.maximized;
      };

      public readonly bringToFront = (w: Widget) => {
         const maxIndex = this._widgets.value.reduce((p, c) => Math.max(p, c.style.zIndex), 0);
         w.style.zIndex = maxIndex + 1;
      };
   }
</script>
