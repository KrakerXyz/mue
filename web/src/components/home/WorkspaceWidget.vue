<template>
   <div class="card h-100">
      <div class="card-header px-2">
         <div class="row g-0">
            <div class="col-auto d-flex align-items-center">
               <div @mousedown="($event: MouseEvent) => startDrag($event)">
                  <slot name="header-icon"></slot>
               </div>
            </div>
            <div class="col mx-2">
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
   import { defineComponent, inject, onUnmounted } from 'vue';
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

         let mouseMoveOrigin: { x: number; y: number; offsetX: number; offsetY: number } | null = null;
         const mouseMove = (evt: MouseEvent) => {
            if (!mouseMoveOrigin) {
               return;
            }
            const diffX = evt.pageX - mouseMoveOrigin.x;
            const diffY = evt.pageY - mouseMoveOrigin.y;
            widgetManager?.setPosition(widget, diffX + mouseMoveOrigin.offsetX, diffY + mouseMoveOrigin.offsetY);
         };

         const dragStop = () => {
            console.log('dragStop');
            window.removeEventListener('mouseup', dragStop);
            window.removeEventListener('mousemove', mouseMove);
            mouseMoveOrigin = null;
         };

         const startDrag = (evt: MouseEvent) => {
            const card = (evt.target as HTMLElement).closest('.card') as HTMLDivElement;
            if (!card) {
               return;
            }
            console.log('startDrag');
            const parent = card.offsetParent as HTMLDivElement;
            mouseMoveOrigin = { x: evt.pageX, y: evt.pageY, offsetX: parent.offsetLeft, offsetY: parent.offsetTop };
            window.addEventListener('mousemove', mouseMove);
            window.addEventListener('mouseup', dragStop);
         };

         onUnmounted(() => dragStop());

         return { close, maximize, startDrag };
      },
   });
</script>
