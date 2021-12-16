<template>
   <div class="card h-100">
      <div class="card-header px-2" @mousedown="($event: MouseEvent) => startDrag($event)">
         <div class="row g-0">
            <div class="col-auto d-flex align-items-center">
               <slot name="header-icon"></slot>
            </div>
            <div class="col mx-2 d-flex align-items-center">
               <div class="w-100">
                  <slot name="header"></slot>
               </div>
            </div>
            <div class="col-auto">
               <button class="btn p-0" @click="widgetManager.toggleMaximized(widget)" title="Maximize Panel">
                  <i class="fal fa-window-maximize fa-fw fa-lg"></i>
               </button>
               <button class="btn p-0" @click="widgetManager.remove(widget)" title="Close Panel">
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
   import { defineComponent, onUnmounted } from 'vue';
   import { WidgetManager } from '@/services/WidgetManager';
   import { Widget } from '@core/models';

   export default defineComponent({
      props: {
         widget: { type: Object as () => Widget, required: true },
         widgetManager: { type: Object as () => WidgetManager, required: true },
      },
      // eslint-disable-next-line vue/no-setup-props-destructure
      setup({ widget, widgetManager }) {
         let mouseMoveOrigin: { x: number; y: number; offsetX: number; offsetY: number } | null = null;
         const mouseMove = (evt: MouseEvent) => {
            if (!mouseMoveOrigin) {
               return;
            }
            const diffX = evt.pageX - mouseMoveOrigin.x;
            const diffY = evt.pageY - mouseMoveOrigin.y;
            widgetManager.setPosition(widget, { left: diffX + mouseMoveOrigin.offsetX, top: diffY + mouseMoveOrigin.offsetY });
         };

         const dragStop = () => {
            window.removeEventListener('mouseup', dragStop);
            window.removeEventListener('mousemove', mouseMove);
            mouseMoveOrigin = null;
         };

         const startDrag = (evt: MouseEvent) => {
            if (widget.workspace.maximized) {
               return;
            }
            const card = (evt.target as HTMLElement).closest('.card') as HTMLDivElement;
            if (!card) {
               return;
            }
            const parent = card.offsetParent as HTMLDivElement;
            mouseMoveOrigin = { x: evt.pageX, y: evt.pageY, offsetX: parent.offsetLeft, offsetY: parent.offsetTop };
            window.addEventListener('mousemove', mouseMove, true);
            window.addEventListener('mouseup', dragStop, true);
            widgetManager?.bringToFront(widget);
         };

         onUnmounted(() => dragStop());

         return { startDrag };
      },
   });
</script>
