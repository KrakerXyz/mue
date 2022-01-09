<template>
   <div ref="outerWrapper">
      <div ref="innerWrapper">
         <div v-for="item of displayItems" :key="item.index" :data-index="item.index">
            <slot :item="item.item" :index="item.index"></slot>
         </div>
      </div>
   </div>
</template>

<script lang="ts">
   import { defineComponent, markRaw, reactive } from 'vue';

   export default defineComponent({
      props: {
         items: { type: Object as () => AsyncGenerator<any>, required: true },
      },
      setup(props) {
         const rawItems = reactive<ItemVm[]>([]);
         (async () => {
            for await (const item of props.items) {
               const vm: ItemVm = markRaw({
                  index: rawItems.length,
                  item,
               });
               rawItems.push(vm);
               if (rawItems.length === 20) {
                  break;
               }
            }
         })();

         // const displayItems = computed(() => {
         //    return rawItems;
         // });

         console.log('Returning items');
         return { displayItems: rawItems };
      },
   });

   interface ItemVm {
      index: number;
      item: any;
   }
</script>
