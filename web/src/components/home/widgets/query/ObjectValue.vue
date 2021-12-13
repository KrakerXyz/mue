<template>
   <div class="font-monospace" @dblclick="toggleExpanded()">
      <div class="row g-2">
         <div class="col-auto text-success" role="button" @click="toggleExpanded()">
            <i class="fas fa-brackets-curly fa-fw"></i>
         </div>
         <div class="col text-truncate" v-if="!expanded">
            {{ value.formattedJson }}
         </div>
         <div class="col-auto">
            <span class="text-muted small">{{ filteredFields.length }} fields</span>
         </div>
      </div>
      <div class="row" v-if="expanded">
         <div class="col overflow-hidden">
            <div class="list-group list-group-flush">
               <div class="list-group-item" v-for="(f, index) of filteredFields" :key="f.key" :class="{ 'pt-0': !index }">
                  <v-field :value="f" :context="context"></v-field>
               </div>
            </div>
         </div>
      </div>
   </div>
</template>

<script lang="ts">
   import { computed, defineComponent } from 'vue';
   import { ObjectValue, ResultContext } from './ResultObjects';

   export default defineComponent({
      props: {
         value: { type: Object as () => ObjectValue, required: true },
         context: { type: Object as () => ResultContext, required: true },
      },
      setup(props) {
         const expanded = computed(() => {
            if (props.context.expandAll) {
               return true;
            }
            const path = props.value.parent?.path ?? '';
            const index = props.context.expandedPaths.indexed[props.value.root.index];
            if (index?.includes(path)) {
               return true;
            }

            if (props.context.expandedPaths.global.includes(path)) {
               return true;
            }

            return false;
         });

         const toggleExpanded = () => {
            let indexed = props.context.expandedPaths.indexed[props.value.root.index];
            if (!indexed) {
               indexed = [];
               // eslint-disable-next-line vue/no-mutating-props
               props.context.expandedPaths.indexed[props.value.root.index] = indexed;
            }

            const path = props.value.parent?.path ?? '';
            const index = indexed.indexOf(path);
            if (index === -1) {
               indexed.push(path);
            } else {
               indexed.splice(index, 1);
            }
         };

         const filteredFields = computed(() => {
            const fields = props.value.fields.filter((f) => {
               if (props.context.hideEmpty) {
                  if (f.value.type === 'object' && !f.value.fields.length) {
                     return false;
                  }
                  if (f.value.type === 'array' && !f.value.values.length) {
                     return false;
                  }
                  if (f.value.type === 'string' && !f.value.value) {
                     return false;
                  }
               }

               if (props.context.hidePaths.includes(f.path)) {
                  return false;
               }

               return true;
            });

            if (props.context.sortFields) {
               fields.sort((a, b) => a.key.localeCompare(b.key));
            }

            return fields;
         });

         return { toggleExpanded, filteredFields, expanded };
      },
   });
</script>
