<template>
   <div role="button" class="font-monospace" @click.stop.prevent="toggleExpanded()">
      <div class="row g-2">
         <div class="col-auto text-primary">
            <i class="fas fa-brackets fa-fw"></i>
         </div>
         <div class="col text-truncate" v-if="!value.state.expanded && !context.expandAll">
            {{ value.formattedJson }}
         </div>
         <div class="col-auto">
            <span class="text-muted small">{{ value.values.length }} element</span>
         </div>
      </div>

      <div v-if="value.state.expanded || context.expandAll" class="row">
         <div class="col overflow-hidden">
            <div class="list-group list-group-flush">
               <div class="list-group-item" v-for="(f, index) of value.values" :key="index" :class="{ 'pt-0': !index }">
                  <template v-if="f.component">
                     <component :is="f.component" :value="f" :context="context"></component>
                  </template>
                  <span v-if="!f.component">{{ f.formattedJson }}</span>
               </div>
            </div>
         </div>
      </div>
   </div>
</template>

<script lang="ts">
   import { defineComponent } from 'vue';
   import { ArrayValue, ResultContext } from './ResultObjects';

   export default defineComponent({
      props: {
         value: { type: Object as () => ArrayValue, required: true },
         context: { type: Object as () => ResultContext, required: true },
      },
      setup(props) {
         const toggleExpanded = () => {
            // eslint-disable-next-line vue/no-mutating-props
            props.value.state.expanded = !props.value.state.expanded;
         };

         return { toggleExpanded };
      },
   });
</script>
