<template>
   <div ref="parent">
      <div ref="inner">
         <!-- min-height is intentional here. I tried with height but it doesn't haven an effect on the scroll -->
         <div :style="{ 'min-height': `${overflow.top}px` }"></div>
         <div v-for="item of displayItems" :key="item.index" :data-index="item.index">
            <slot :item="item.item" :index="item.index"></slot>
         </div>
         <div :style="{ 'min-height': `${overflow.bottom}px` }"></div>
      </div>
   </div>
</template>

<script lang="ts">
   import { computed, defineComponent, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';

   let lastScrollPosition = -1;

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
         const inner = ref<HTMLDivElement | undefined>();
         const displayItems = ref([] as any[]);

         const overflow = reactive<Overflow>({
            top: 0,
            offsetIndex: 0,
            bottom: 0,
         });

         let resizeObserver: ResizeObserver | null = null;

         const reset = async () => {
            resizeObserver?.disconnect();
            resizeObserver = null;
            displayItems.value = reactive([]);
            overflow.bottom = 0;
            overflow.top = 0;
            overflow.offsetIndex = 0;
            lastScrollPosition = -1;
            await nextTick();
         };

         watch([vms, parent, inner], async (x) => {
            const [vms, parent, inner] = x;

            if (!parent || !inner) {
               return;
            }

            console.debug(`Vms updated ${vms.length}`), { immediate: true };
            await reset();
            await fit(vms, displayItems.value, parent, overflow);

            resizeObserver = new ResizeObserver(async () => {
               console.debug('Resize triggered');
               await fit(vms, displayItems.value, parent, overflow);
            });
            resizeObserver.observe(inner);
         });

         onMounted(() => {
            if (!parent.value) {
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

         return { displayItems, parent, overflow, inner };
      },
   });

   async function fit(srcItems: ItemVm[], displayItems: ItemVm[], containerDiv: HTMLDivElement, overflow: Overflow): Promise<void> {
      if (containerDiv.scrollTop >= lastScrollPosition) {
         let item = containerDiv.firstElementChild?.firstElementChild?.nextElementSibling as HTMLElement;
         let outOfViewElementsCount = 0;
         let outOfViewElementHeight = 0;
         while (item) {
            const inView = item.offsetTop - containerDiv.offsetTop + item.offsetHeight - containerDiv.scrollTop;
            if (inView > 0) {
               break;
            }

            outOfViewElementsCount++;
            outOfViewElementHeight += item.offsetHeight;
            item = item?.nextElementSibling as HTMLElement;
         }

         if (outOfViewElementHeight) {
            displayItems.splice(0, outOfViewElementsCount);
            overflow.top += outOfViewElementHeight + outOfViewElementsCount * 1;
            overflow.offsetIndex += outOfViewElementsCount;
            console.debug(`Removed ${outOfViewElementsCount} items from top`);
            await nextTick();
         }

         const origDisplayLen = displayItems.length;
         while (
            containerDiv.clientHeight >= containerDiv.scrollHeight - containerDiv.scrollTop - overflow.bottom &&
            displayItems.length + overflow.offsetIndex < srcItems.length
         ) {
            const vm = srcItems[displayItems.length + overflow.offsetIndex];
            displayItems.push(vm);
            await nextTick();
         }

         const newItemsLen = displayItems.length - origDisplayLen;
         if (newItemsLen) {
            console.debug(`Added ${newItemsLen} items to bottom`);
         }

         const avgHeight = containerDiv.clientHeight / displayItems.length;
         const remainingRecords = srcItems.length - displayItems.length - overflow.offsetIndex;
         overflow.bottom = remainingRecords * avgHeight;
      } else {
         const topDummy = containerDiv.firstElementChild?.firstElementChild as HTMLElement;
         let addedTop = 0;
         while (overflow.offsetIndex && topDummy.offsetHeight > containerDiv.scrollTop) {
            const vm = srcItems[overflow.offsetIndex - 1];
            displayItems.splice(0, 0, vm);
            await nextTick();
            const newHeight = (containerDiv.firstElementChild?.firstElementChild?.nextElementSibling as HTMLElement).offsetHeight;
            overflow.offsetIndex--;
            overflow.top = overflow.offsetIndex ? Math.max(overflow.top - newHeight, 0) : 0;
            addedTop++;
            await nextTick();
         }

         if (addedTop) {
            console.debug(`Added ${addedTop} items to top`);
         }
      }

      let lastItem = containerDiv.firstElementChild?.lastElementChild?.previousElementSibling as HTMLElement;
      let removedBottom = 0;
      while (lastItem && lastItem.offsetTop - containerDiv.scrollTop > containerDiv.offsetHeight + containerDiv.offsetTop) {
         overflow.bottom += lastItem.offsetHeight;
         displayItems.splice(displayItems.length - 1, 1);
         removedBottom++;
         lastItem = lastItem.previousElementSibling as HTMLElement;
      }

      if (removedBottom) {
         console.debug(`Removed ${removedBottom} items from bottom`);
      }

      lastScrollPosition = containerDiv.scrollTop;
   }

   interface Overflow {
      top: number;
      /** The number of elements that are offscreen on the top and have been de-rendered */
      offsetIndex: number;
      bottom: number;
   }

   interface ItemVm {
      index: number;
      item: any;
   }
</script>
