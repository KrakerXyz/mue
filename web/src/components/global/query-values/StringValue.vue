<template>
   <div
      class="text-orange"
      :class="{ 'text-truncate': !isExpanded, 'text-wrap': isExpanded }"
      role="button"
      @click="contextManager.togglePathExpanded(basePath, resultIndex)"
   >
      '{{ value }}'
   </div>
</template>

<script lang="ts">
   import { defineComponent } from 'vue';
   import { ResultContextManager } from '@/components/widgets/Query.vue';

   export default defineComponent({
      props: {
         value: { type: String, required: true },
         resultIndex: { type: Number, required: true },
         basePath: { type: String, required: true },
         contextManager: { type: Object as () => ResultContextManager, required: true },
      },
      setup(props) {
         const isExpanded = props.contextManager.useIsExpanded(props.basePath, props.resultIndex);
         return { isExpanded };
      },
   });
</script>
