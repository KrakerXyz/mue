<template>
   <div ref="outerWrapperRef">
      <div ref="innerWrapperRef">
         <!-- min-height is intentional here. I tried with height but it doesn't haven an effect on the scroll -->
         <div ref="topSpacerRef" :style="{ 'min-height': `${overflow.top}px` }"></div>
         <div v-for="item of displayItems" :key="item.index" :data-index="item.index" :ref="e => item.el = e as HTMLElement">
            <slot :item="item.item" :index="item.index"></slot>
         </div>
         <div ref="bottomSpacerRef" :style="{ 'min-height': `${Math.max(overflow.bottom, 10)}px` }"></div>
      </div>
   </div>
</template>

<script lang="ts">
   import { defineComponent, markRaw, onUnmounted, reactive, Ref, ref, watch, nextTick, toRef } from 'vue';

   const verbose = true;
   export default defineComponent({
      props: {
         items: { type: Object as () => AsyncGenerator<any>, required: true },
         beginUpdate: { type: Boolean, default: false },
      },
      setup(props) {
         const loadPosition = ref<number | 'done'>(1);
         const rawItems = reactive<ItemVm[]>([]);
         let enumDone = false;

         const beginUpdate = toRef(props, 'beginUpdate');
         watch(beginUpdate, (up) => {
            if (verbose) {
               console.log(`beginUpdate: ${up}`);
            }
            runFit();
         });

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
                  runFit();
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
            topInView: false,
            bottomInView: false,
         });

         let runFitCurrent: Promise<void> | null = null;
         let runFit: () => Promise<void> = async () => {
            if (beginUpdate.value) {
               if (verbose) {
                  console.debug('Skipping runFit while beginUpdate');
                  return;
               }
            }
            if (!outerWrapperRef.value || !innerWrapperRef.value || !topSpacerRef.value || !bottomSpacerRef.value) {
               return;
            }
            let waitCount = 0;
            while (runFitCurrent) {
               waitCount++;
               if (verbose) {
                  console.log(`Awaiting existing fit run (count ${waitCount})`);
               }
               await runFitCurrent;
            }
            runFitCurrent = fit2(rawItems, displayItems, loadPosition, outerWrapperRef.value, overflow);
            await runFitCurrent;
            runFitCurrent = null;
         };

         let resizeObserver: ResizeObserver | null = null;
         watch(outerWrapperRef, (div) => {
            resizeObserver?.disconnect();
            resizeObserver = null;
            if (!div) {
               return;
            }
            let lastSize = 0;
            resizeObserver = new ResizeObserver(async () => {
               if (!outerWrapperRef.value) {
                  return;
               }
               if (outerWrapperRef.value.offsetHeight === lastSize) {
                  return;
               }
               lastSize = outerWrapperRef.value.offsetHeight;
               if (verbose) {
                  console.debug('Resize triggered');
               }
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

         let intersectionObserver: IntersectionObserver | null = null;
         watch([outerWrapperRef, topSpacerRef, bottomSpacerRef], (els) => {
            intersectionObserver?.disconnect();
            intersectionObserver = null;
            const [outer, top, bottom] = els;
            if (!outer || !top || !bottom) {
               return;
            }

            intersectionObserver = new IntersectionObserver(
               (changes) => {
                  for (const c of changes) {
                     if (c.target === top) {
                        overflow.topInView = c.isIntersecting;
                     } else if (c.target === bottom) {
                        overflow.bottomInView = c.isIntersecting;
                     }
                  }
                  if (verbose) {
                     console.log(`intersection top:${overflow.topInView}, bottom:${overflow.bottomInView}`);
                  }
                  if (overflow.topInView || overflow.bottomInView) {
                     runFit();
                  }
               },
               {
                  root: outer,
                  threshold: 0,
               }
            );

            intersectionObserver.observe(top);
            intersectionObserver.observe(bottom);
         });

         onUnmounted(() => {
            console.debug('VirtualList unmounted');
            resizeObserver?.disconnect();
            intersectionObserver?.disconnect();
         });

         return { displayItems, outerWrapperRef, innerWrapperRef, topSpacerRef, bottomSpacerRef, overflow };
      },
   });

   //I'm trying to do a while to keep adding items until spacers go out of view but it's not working either because there's multiple fits running or simply waiting for next tick does not get the intersection observer time to call back. Lets try adding a check for already running (proxy fit2 that queues calls) and/or using a promise type await

   async function fit2(rawItems: ItemVm[], displayItems: ItemVm[], loadPosition: Ref<number | 'done'>, outerWrapper: HTMLDivElement, overflow: Overflow) {
      if (verbose) {
         console.debug('---fit2');
      }

      //Start from the top of the display items and remove any where the bottom edge is off screen
      let remTopCount = 0;
      for (const di of displayItems) {
         if (!di.el) {
            break;
         }
         const clientBottom = di.el.offsetTop + di.el.offsetHeight - outerWrapper.offsetTop - outerWrapper.scrollTop;
         if (clientBottom > -5) {
            break;
         }
         overflow.top += di.el.offsetHeight;
         overflow.offsetIndex++;
         remTopCount++;
      }

      if (remTopCount) {
         displayItems.splice(0, remTopCount);
         if (verbose) {
            console.debug(`Removed ${remTopCount} items from top`);
         }
         //Next tick does not give the intersection observer time to run
         await new Promise((r) => setTimeout(r, 2));
      }

      //Check for any display items where the top edge is off screen and remove them
      let remBottomCount = 0;
      for (let i = displayItems.length - 1; i > -1; i--) {
         const di = displayItems[i];
         if (!di.el) {
            continue;
         }
         const clientTop = di.el.offsetTop - outerWrapper.offsetTop - outerWrapper.scrollTop;
         if (clientTop < outerWrapper.offsetHeight) {
            break;
         }
         overflow.bottom += di.el.offsetHeight;
         remBottomCount++;
      }

      if (remBottomCount) {
         const removed = displayItems.splice(displayItems.length - remBottomCount, remBottomCount);
         if (verbose) {
            console.debug(`Removed ${removed.length} items from bottom`);
         }
         //Next tick does not give the intersection observer time to run
         await nextTick();
         await new Promise((r) => setTimeout(r));
      }

      //If top space is in view, add a item to the top if we have one
      while (overflow.topInView && overflow.offsetIndex) {
         const toAdd = rawItems[overflow.offsetIndex - 1];
         displayItems.splice(0, 0, toAdd);
         overflow.offsetIndex--;
         if (overflow.top) {
            await nextTick();
            overflow.top -= toAdd.el?.offsetHeight ?? 0;
            if (overflow.top < 0) {
               overflow.top = 0;
            }
         }
         //Next tick does not give the intersection observer time to run
         await nextTick();
         await new Promise((r) => setTimeout(r));
      }

      //If the top edge of the bottom space is visible, add more items to the end
      while (overflow.bottomInView && overflow.offsetIndex + displayItems.length < rawItems.length) {
         const toAdd = rawItems[displayItems.length + overflow.offsetIndex];
         displayItems.push(toAdd);
         if (verbose) {
            console.debug('Added item to bottom');
         }
         if (overflow.bottom) {
            await nextTick();
            overflow.bottom -= toAdd.el?.offsetHeight ?? 0;
            if (overflow.bottom < 0) {
               overflow.bottom = 0;
            }
         }
         //Next tick does not give the intersection observer time to run
         await nextTick();
         await new Promise((r) => setTimeout(r));
      }

      if (loadPosition.value !== 'done' && loadPosition.value === displayItems.length + overflow.offsetIndex) {
         loadPosition.value++;
      }
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
      topInView: boolean;
      bottomInView: boolean;
   }
</script>
