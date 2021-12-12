<template>
   <div class="card h-100">
      <div class="card-header">
         <div class="row">
            <div class="col">
               <slot name="header"></slot>
            </div>
            <div class="col-auto">
               <button class="btn p-0" @click="maximize()" title="Maximize Panel">
                  <i class="fal fa-window-maximize fa-fw fa-lg"></i>
               </button>
               <button class="btn p-0" @click="close()" title="Close Panel">
                  <i class="fal fa-times fa-fw fa-lg"></i>
               </button>
            </div>
         </div>
         <slot name="header2"></slot>
      </div>
      <div class="card-body flex-grow-1 overflow-hidden p-0">
         <slot name="body"></slot>
      </div>
   </div>
</template>

<script lang="ts">
   import { defineComponent, inject } from 'vue';
   import { WidgetManager } from './WidgetManager';
   import { Widget } from '@core/models';

   export default defineComponent({
      setup(props, { attrs }) {
         const widget: Widget = attrs.widget as any;
         if (!widget) {
            console.error('attr.widget not found');
         }

         const widgetManager = inject<WidgetManager>(WidgetManager.INJECT);

         const close = () => {
            widgetManager?.remove(widget);
         };

         const maximize = () => {
            widgetManager?.toggleMaximized(widget);
         };

         return { close, maximize };
      },
   });
</script>
