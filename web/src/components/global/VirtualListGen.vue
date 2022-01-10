<template>
   <div ref="outerWrapperRef">
      <div ref="innerWrapperRef" v-if="!beginUpdate">
         <!-- min-height is intentional here. I tried with height but it doesn't haven an effect on the scroll -->
         <div ref="topSpacerRef" :style="{ 'min-height': `${overflow.top}px` }"></div>
         <div v-for="item of displayItems" :key="item.index" :data-index="item.index" :ref="e => item.el = e as HTMLElement">
            <slot :item="item.item" :index="item.index"></slot>
         </div>
         <div ref="bottomSpacerRef" :style="{ 'min-height': `${overflow.bottom}px` }"></div>
      </div>
   </div>
</template>

<script lang="ts">
   import { defineComponent, markRaw, nextTick, onUnmounted, reactive, Ref, ref, watch } from 'vue';

   export default defineComponent({
      props: {
         items: { type: Object as () => AsyncGenerator<any>, required: true },
         beginUpdate: { type: Boolean, default: false },
      },
      setup(props) {
         const loadPosition = ref<number | 'done'>(1);
         const rawItems = reactive<ItemVm[]>([]);
         let enumDone = false;

         let running = false;
         watch(
            loadPosition,
            async () => {
               if (running) {
                  return;
               }
               if (enumDone) {
                  return;
               }
               running = true;
               while (loadPosition.value > rawItems.length) {
                  const next = await props.items.next();
                  if (next.done) {
                     enumDone = true;
                     break;
                  }
                  const vm: ItemVm = {
                     index: rawItems.length,
                     item: markRaw(next.value),
                  };
                  rawItems.push(vm);
                  await runFit();
               }
               running = false;
            },
            { immediate: true }
         );

         const displayItems = reactive<ItemVm[]>([]);

         const outerWrapperRef = ref<HTMLDivElement | undefined>();
         const innerWrapperRef = ref<HTMLDivElement | undefined>();
         const topSpacerRef = ref<HTMLDivElement | undefined>();
         const bottomSpacerRef = ref<HTMLDivElement | undefined>();

         const overflow = reactive<Overflow>({
            top: 0,
            offsetIndex: 0,
            bottom: 10,
         });

         let runFit: () => Promise<void> = async () => {
            if (!outerWrapperRef.value || !innerWrapperRef.value || !topSpacerRef.value || !bottomSpacerRef.value) {
               return;
            }
            await fit2(rawItems, displayItems, loadPosition, outerWrapperRef.value, bottomSpacerRef.value, overflow);
         };

         let resizeObserver: ResizeObserver | null = null;
         watch(innerWrapperRef, (div) => {
            resizeObserver?.disconnect();
            resizeObserver = null;
            if (!div) {
               return;
            }
            resizeObserver = new ResizeObserver(async () => {
               console.debug('Resize triggered');
               runFit();
            });
            resizeObserver.observe(div);
         });

         watch(outerWrapperRef, (div) => {
            if (!div) {
               return;
            }
            div.addEventListener(
               'scroll',
               () => {
                  runFit();
               },
               { capture: true, passive: true }
            );
         });

         onUnmounted(() => {
            console.debug('VirtualList unmounted');
            resizeObserver?.disconnect();
         });

         return { displayItems, outerWrapperRef, innerWrapperRef, topSpacerRef, bottomSpacerRef, overflow };
      },
   });

   async function fit2(
      rawItems: ItemVm[],
      displayItems: ItemVm[],
      loadPosition: Ref<number | 'done'>,
      outerWrapper: HTMLDivElement,
      bottomSpacer: HTMLDivElement,
      overflow: Overflow
   ) {
      let remTopCount = 0;
      for (const di of displayItems) {
         if (!di.el) {
            break;
         }
         const clientBottom = di.el.offsetTop + di.el.clientHeight - outerWrapper.offsetTop - outerWrapper.scrollTop;
         if (clientBottom > 0) {
            break;
         }
         overflow.top += di.el.clientHeight;
         overflow.offsetIndex++;
         remTopCount++;
      }

      if (remTopCount) {
         displayItems.splice(0, remTopCount);
         console.debug(`Removed ${remTopCount} items from top`);
         return;
      }

      let remBottomCount = 0;
      for (let i = displayItems.length - 1; i > -1; i--) {
         const di = displayItems[i];
         if (!di.el) {
            continue;
         }
         const clientTop = di.el.offsetTop - outerWrapper.offsetTop - outerWrapper.scrollTop;
         if (clientTop < outerWrapper.clientHeight) {
            break;
         }
         overflow.bottom += di.el.clientHeight;
         remBottomCount++;
      }

      if (remBottomCount) {
         displayItems.splice(displayItems.length - remBottomCount, remBottomCount);
         console.debug(`Removed ${remBottomCount} items from bottom`);
         return;
      }

      if (
         overflow.offsetIndex + displayItems.length < rawItems.length &&
         bottomSpacer.offsetTop - outerWrapper.offsetTop - outerWrapper.scrollTop < outerWrapper.clientHeight
      ) {
         displayItems.push(rawItems[displayItems.length + overflow.offsetIndex]);
      }

      if (loadPosition.value !== 'done' && loadPosition.value === displayItems.length + overflow.offsetIndex) {
         loadPosition.value++;
      }
   }

   let lastScrollPosition = -1;
   async function _fit(srcItems: ItemVm[], displayItems: ItemVm[], parentWrapper: HTMLDivElement, overflow: Overflow): Promise<void> {
      if (parentWrapper.scrollTop >= lastScrollPosition) {
         let item = parentWrapper.firstElementChild?.firstElementChild?.nextElementSibling as HTMLElement;
         let outOfViewElementsCount = 0;
         let outOfViewElementHeight = 0;
         while (item) {
            const inView = item.offsetTop - parentWrapper.offsetTop + item.offsetHeight - parentWrapper.scrollTop;
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
            parentWrapper.clientHeight >= parentWrapper.scrollHeight - parentWrapper.scrollTop - overflow.bottom &&
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

         const avgHeight = parentWrapper.clientHeight / displayItems.length;
         const remainingRecords = srcItems.length - displayItems.length - overflow.offsetIndex;
         overflow.bottom = remainingRecords * avgHeight;
      } else {
         const topDummy = parentWrapper.firstElementChild?.firstElementChild as HTMLElement;
         let addedTop = 0;
         while (overflow.offsetIndex && topDummy.offsetHeight > parentWrapper.scrollTop) {
            const vm = srcItems[overflow.offsetIndex - 1];
            displayItems.splice(0, 0, vm);
            await nextTick();
            const newHeight = (parentWrapper.firstElementChild?.firstElementChild?.nextElementSibling as HTMLElement).offsetHeight;
            overflow.offsetIndex--;
            overflow.top = overflow.offsetIndex ? Math.max(overflow.top - newHeight, 0) : 0;
            addedTop++;
            await nextTick();
         }

         if (addedTop) {
            console.debug(`Added ${addedTop} items to top`);
         }
      }

      let lastItem = parentWrapper.firstElementChild?.lastElementChild?.previousElementSibling as HTMLElement;
      let removedBottom = 0;
      while (lastItem && lastItem.offsetTop - parentWrapper.scrollTop > parentWrapper.offsetHeight + parentWrapper.offsetTop) {
         overflow.bottom += lastItem.offsetHeight;
         displayItems.splice(displayItems.length - 1, 1);
         removedBottom++;
         lastItem = lastItem.previousElementSibling as HTMLElement;
      }

      if (removedBottom) {
         console.debug(`Removed ${removedBottom} items from bottom`);
      }

      lastScrollPosition = parentWrapper.scrollTop;
   }

   interface ItemVm {
      index: number;
      item: any;
      /** To be set by vue in the html */
      el?: HTMLElement | undefined;
   }

   interface Overflow {
      top: number;
      /** The number of elements that are offscreen on the top and have been de-rendered */
      offsetIndex: number;
      bottom: number;
   }
</script>
