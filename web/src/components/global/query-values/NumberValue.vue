<template>
   <div class="text-primary">
      {{ value.toLocaleString() }}
   </div>
</template>

<script lang="ts">
   import { defineComponent } from 'vue';
   import { ResultContextManager } from '@/services';

   export default defineComponent({
      props: {
         value: { type: Number, required: true },
         resultIndex: { type: Number, required: true },
         basePath: { type: String, required: true },
         contextManager: { type: Object as () => ResultContextManager, required: true },
      },
      setup() {
         return {};
      },
   });
</script>
