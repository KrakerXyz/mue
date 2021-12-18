<template>
   <div v-for="item of window" :key="item.id">
      <slot :item="item.item" :index="item.index"></slot>
   </div>
</template>

<script lang="ts">
   import { v4 } from 'uuid';
   import { computed, defineComponent, reactive } from 'vue';

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

         const window = reactive<ItemVm[]>(vms.value.slice(0, 1));

         return { window };
      },
   });

   interface ItemVm {
      id: string;
      index: number;
      item: any;
      height: number | null;
   }
</script>
