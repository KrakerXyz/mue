<template>
   <div ref="parent">
      <div v-for="item of partial" :key="item.id">
         <slot :item="item.item" :index="item.index"></slot>
      </div>
      <!-- min-height is intentional here. I tried with height but it doesn't haven an effect on the scroll -->
      <div v-if="overflow.bottom" :style="{ 'min-height': `${overflow.bottom}px` }"></div>
   </div>
</template>

<script lang="ts">
   import { v4 } from 'uuid';
   import { computed, defineComponent, nextTick, reactive, ref, watch } from 'vue';

   export default defineComponent({
      props: {
         items: { type: Array, required: true },
      },
      setup(props) {
         const vms = computed(() => {
            return props.items.map<ItemVm>((i, index) => {
               return {
                  id: v4(),
                  index,
                  item: i,
                  height: null,
               };
            });
         });

         const parent = ref<HTMLDivElement | undefined>();
         const partial = ref([] as any[]);

         const overflow = reactive({
            top: 0,
            bottom: 0,
         });

         watch([vms, parent], async (x) => {
            const [vms, div] = x;

            overflow.bottom = 0;
            overflow.top = 0;

            if (!div) {
               return;
            }

            await nextTick();

            partial.value = reactive([]);
            console.debug(`Vms updated ${vms.length}`), { immediate: true };

            while (div.clientHeight >= div.scrollHeight && partial.value.length < vms.length) {
               partial.value.push(vms[partial.value.length]);
               await nextTick();
            }

            if (partial.value.length) {
               console.debug(`Loaded ${partial.value.length} records into list`);
            }

            const avgHeight = div.clientHeight / partial.value.length;
            const remainingRecords = vms.length - partial.value.length;
            overflow.bottom = remainingRecords * avgHeight;
         });

         return { partial, parent, overflow };
      },
   });

   interface ItemVm {
      id: string;
      index: number;
      item: any;
      height: number | null;
   }
</script>
