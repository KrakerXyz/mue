<template>
   <span
      class="text-orange"
      :class="{ 'text-truncate': !isExpanded, 'text-wrap': isExpanded }"
      role="button"
      @click="contextManager.togglePathExpanded(basePath, resultIndex)"
   >
      '{{ value }}'
   </span>
</template>

<script lang="ts">
   import { computed, defineComponent } from 'vue';
   import { ResultContextManager } from '@/services';

   export default defineComponent({
      props: {
         value: { type: String, required: true },
         resultIndex: { type: Number, required: true },
         basePath: { type: String, required: true },
         contextManager: { type: Object as () => ResultContextManager, required: true },
      },
      setup(props) {
         const isExpanded = computed(() => props.contextManager.isExpanded(props.basePath, props.resultIndex));
         return { isExpanded };
      },
   });
</script>
