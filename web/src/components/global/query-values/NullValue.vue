<template>
   <span>
      {{ str }}
   </span>
</template>

<script lang="ts">
   import { computed, defineComponent } from 'vue';
   import { ResultContextManager } from '@/components/widgets/Query.vue';

   export default defineComponent({
      props: {
         value: { type: String, required: false },
         resultIndex: { type: Number, required: true },
         basePath: { type: String, required: true },
         contextManager: { type: Object as () => ResultContextManager, required: true },
      },
      setup(props) {
         const str = computed(() => (props.value === undefined ? 'undefined' : 'null'));
         return { str };
      },
   });
</script>
