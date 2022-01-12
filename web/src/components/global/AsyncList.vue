<template>
   <div ref="innerWrapperRef">
      <div v-for="item of displayItems" :key="item.index" :data-index="item.index">
         <slot :item="item.item" :index="item.index"></slot>
      </div>
   </div>
</template>

<script lang="ts">
   import { computed, defineComponent, markRaw, reactive, ref, watch } from 'vue';

   export default defineComponent({
      props: {
         items: { type: Object as () => AsyncGenerator<any>, required: true },
      },
      setup(props) {
         const loadPosition = ref<number | 'done'>(100);
         const rawItems = reactive<ItemVm[]>([]);

         let running = false;
         watch(
            loadPosition,
            async () => {
               if (running) {
                  return;
               }
               if (loadPosition.value === 'done') {
                  return;
               }
               running = true;
               while (loadPosition.value > rawItems.length) {
                  const next = await props.items.next();
                  if (next.done) {
                     loadPosition.value = 'done';
                     break;
                  }
                  const vm: ItemVm = {
                     index: rawItems.length,
                     item: markRaw(next.value),
                  };
                  rawItems.push(vm);
               }
               running = false;
            },
            { immediate: true }
         );

         const displayItems = computed(() => rawItems);

         return { displayItems };
      },
   });

   interface ItemVm {
      index: number;
      item: any;
   }
</script>
