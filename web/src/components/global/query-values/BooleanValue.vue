<template>
   <div :class="{ 'text-success': value, 'text-danger': !value }">
      {{ value }}
   </div>
</template>

<script lang="ts">
   import { defineComponent } from 'vue';
   import { ResultContextManager } from '@/components/widgets/Query.vue';

   export default defineComponent({
      props: {
         value: { type: Boolean, required: true },
         resultIndex: { type: Number, required: true },
         basePath: { type: String, required: true },
         contextManager: { type: Object as () => ResultContextManager, required: true },
      },
      setup() {
         return {};
      },
   });
</script>
