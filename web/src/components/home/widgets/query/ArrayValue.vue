<template>
   <div class="font-monospace">
      <div class="row g-2">
         <div class="col-auto text-primary" role="button" @click="toggleExpanded()">
            <i class="fas fa-brackets fa-fw"></i>
         </div>
         <div class="col text-truncate" v-if="!expanded">
            {{ value.formattedJson }}
         </div>
         <div class="col-auto">
            <span class="text-muted small">{{ value.values.length }} element</span>
         </div>
      </div>

      <div v-if="expanded" class="row">
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
   import { computed, defineComponent } from 'vue';
   import { ArrayValue, ResultContext } from './ResultObjects';

   export default defineComponent({
      props: {
         value: { type: Object as () => ArrayValue, required: true },
         context: { type: Object as () => ResultContext, required: true },
      },
      setup(props) {
         const expanded = computed(() => {
            if (props.context.expandAll) {
               return true;
            }
            const path = props.value.parent.path;
            const index = props.context.expandedPaths.indexed[props.value.parent.parent.root.index];
            if (index?.includes(path)) {
               return true;
            }

            if (props.context.expandedPaths.global.includes(path)) {
               return true;
            }

            return false;
         });

         const toggleExpanded = () => {
            // eslint-disable-next-line vue/no-mutating-props

            let indexed = props.context.expandedPaths.indexed[props.value.parent.parent.root.index];
            if (!indexed) {
               indexed = [];
               // eslint-disable-next-line vue/no-mutating-props
               props.context.expandedPaths.indexed[props.value.parent.parent.root.index] = indexed;
            }

            const path = props.value.parent.path;
            const index = indexed.indexOf(path);
            if (index === -1) {
               indexed.push(path);
            } else {
               indexed.splice(index, 1);
            }
         };

         return { toggleExpanded, expanded };
      },
   });
</script>
