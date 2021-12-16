<template>
   <span class="badge" :class="bg">{{ name }}</span>
</template>

<script lang="ts">
   import { useConnections } from '@/services';
   import { computed, defineComponent } from 'vue';

   const cons = useConnections();
   const sortedNames = computed(() => cons.value?.map((c) => c.name).sort((a, b) => a.localeCompare(b)));

   const bgMap = ['bg-primary', 'bg-success', 'bg-warning', 'bg-danger', 'bg-info', 'bg-secondary', 'bg-dark'];

   export default defineComponent({
      props: {
         name: { type: String, required: true },
      },
      setup(props) {
         const bg = computed(() => {
            const nameIndex = sortedNames.value?.indexOf(props.name) ?? 0;
            const cls = bgMap[nameIndex % bgMap.length];
            return cls;
         });

         return { bg };
      },
   });
</script>
