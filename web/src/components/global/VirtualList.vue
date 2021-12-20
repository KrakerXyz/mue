<template>
   <div ref="parent">
      <div v-for="item of displayItems" :key="item.index" :data-index="item.index">
         <slot :item="item.item" :index="item.index"></slot>
      </div>
      <!-- min-height is intentional here. I tried with height but it doesn't haven an effect on the scroll -->
      <div :style="{ 'min-height': `${overflow.bottom}px` }" ref="bottomDummy"></div>
   </div>
</template>

<script lang="ts">
   import { computed, defineComponent, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';

   export default defineComponent({
      props: {
         items: { type: Array, required: true },
      },
      setup(props) {
         const vms = computed(() => {
            return props.items.map<ItemVm>((i, index) => {
               return {
                  index,
                  item: i,
               };
            });
         });

         const parent = ref<HTMLDivElement | undefined>();
         const displayItems = ref([] as any[]);

         const overflow = reactive<Overflow>({
            top: 0,
            bottom: 0,
         });

         let resizeObserver: ResizeObserver | null = null;

         const reset = async () => {
            resizeObserver?.disconnect();
            displayItems.value = reactive([]);
            overflow.bottom = 0;
            overflow.top = 0;
            await nextTick();
         };

         watch([vms, parent], async (x) => {
            const [vms, div] = x;

            if (!div) {
               return;
            }

            console.debug(`Vms updated ${vms.length}`), { immediate: true };
            await reset();
            await fit(vms, displayItems.value, div, overflow);

            resizeObserver = new ResizeObserver(async () => {
               console.debug('Resize triggered');
               await fit(vms, displayItems.value, div, overflow);
            });
            resizeObserver.observe(div);
         });

         const bottomDummy = ref<HTMLDivElement>();

         onMounted(() => {
            if (!parent.value || !bottomDummy.value) {
               console.warn('Missing parent');
               return;
            }

            parent.value.addEventListener(
               'scroll',
               () => {
                  fit(vms.value, displayItems.value, parent.value!, overflow);
               },
               { capture: true, passive: true }
            );
         });

         onUnmounted(() => {
            console.debug('VirtualList unmounted');
            resizeObserver?.disconnect();
         });

         return { displayItems, parent, overflow, bottomDummy };
      },
   });

   async function fit(srcItems: ItemVm[], displayItems: ItemVm[], containerDiv: HTMLDivElement, overflow: Overflow): Promise<void> {
      const origDisplayLen = displayItems.length;
      while (
         containerDiv.clientHeight >= containerDiv.scrollHeight - containerDiv.scrollTop - (overflow.bottom + overflow.top) &&
         displayItems.length < srcItems.length
      ) {
         displayItems.push(srcItems[displayItems.length]);
         await nextTick();
      }

      const newItemsLen = displayItems.length - origDisplayLen;
      if (newItemsLen) {
         console.log(`${newItemsLen > 0 ? 'Added' : 'Removed'} ${Math.abs(newItemsLen)} items from display list`);
      }

      const avgHeight = containerDiv.clientHeight / displayItems.length;
      const remainingRecords = srcItems.length - displayItems.length;
      overflow.bottom = remainingRecords * avgHeight;
   }

   interface Overflow {
      top: number;
      bottom: number;
   }

   interface ItemVm {
      index: number;
      item: any;
   }
</script>
