<template>
   <div class="h-100 w-100 bg-secondary position-relative">
      <div
         v-for="w of widgetManager.widgets"
         :key="w.id"
         :id="w.id"
         class="position-absolute bg-white shadow"
         :class="{ rounded: !w.workspace.maximized }"
         :style="w.workspace.maximized ? { ...maximizedStyle, zIndex: w.workspace.style.zIndex } : w.workspace.style"
         v-resizable="getResizableOptions(w)"
         @click="widgetManager.bringToFront(w)"
      >
         <component :is="`v-${w.component.name}`" v-bind="w.component.props" :widget="w" :widgetManager="widgetManager"></component>
      </div>
   </div>
</template>

<script lang="ts">
   import { defineComponent } from 'vue';
   import { WidgetStyle, Widget } from '@core/models';
   import { WidgetManager } from '@/services';
   import { widgetComponents } from './widgets';
   import { ResizableOptions } from './global/resizableDirective';

   export default defineComponent({
      components: widgetComponents,
      props: {
         widgetManager: { type: Object as () => WidgetManager, required: true },
      },
      setup(props) {
         const maximizedStyle: WidgetStyle = {
            zIndex: 0,
            height: '100% !important',
            width: '100% !important',
         };

         const getResizableOptions = (w: Widget) => {
            const opts: ResizableOptions = {
               change: (r) => {
                  props.widgetManager.setPosition(w, r);
               },
            };
            return opts;
         };

         return { maximizedStyle, getResizableOptions };
      },
   });
</script>
