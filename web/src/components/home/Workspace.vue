<template>
   <div class="h-100 w-100 bg-secondary position-relative">
      <div
         v-for="w of widgets"
         :key="w.id"
         :id="w.id"
         v-resizable="getResizableOptions(w)"
         class="position-absolute bg-white shadow"
         :class="{ rounded: !w.maximized }"
         :style="w.maximized ? { ...maximizedStyle, zIndex: w.style.zIndex } : w.style"
         @click="bringToFront(w)"
      >
         <component :is="w.component" v-bind="w.props" :widget="w" @update-props="updateProps(w, $event)"></component>
      </div>
   </div>
</template>

<script lang="ts">
   import { defineComponent, inject } from 'vue';
   import Collections from './widgets/Collections.vue';
   import Databases from './widgets/Databases.vue';
   import Query from './widgets/query/Query.vue';
   import { Widget, WidgetStyle } from '@core/models';
   import { WidgetManager } from './WidgetManager';
   import { ResizableOptions } from '../global/resizableDirective';

   export default defineComponent({
      components: {
         Databases,
         Collections,
         Query,
      },
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

         const getResizableOptions = (w: Widget) => {
            const opts: ResizableOptions = {
               change: (r) => {
                  manager.setPosition(w, r);
               },
            };
            return opts;
         };

         return { widgets: manager.widgets, bringToFront: manager.bringToFront, maximizedStyle, updateProps: manager.updateProps, getResizableOptions };
      },
   });
</script>
