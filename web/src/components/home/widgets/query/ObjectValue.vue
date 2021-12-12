<template>
   <div role="button" class="font-monospace" @click.stop.prevent="toggleExpanded()">
      <div class="row g-2">
         <div class="col-auto text-success">
            <i class="fas fa-brackets-curly fa-fw"></i>
         </div>
         <div class="col text-truncate" v-if="!value.state.expanded && !context.expandAll">
            {{ value.formattedJson }}
         </div>
         <div class="col-auto">
            <span class="text-muted small">{{ filteredFields.length }} fields</span>
         </div>
      </div>
      <div class="row" v-if="value.state.expanded || context.expandAll">
         <div class="col overflow-hidden">
            <div class="list-group list-group-flush">
               <div class="list-group-item" v-for="(f, index) of filteredFields" :key="f.key" :class="{ 'pt-0': !index }">
                  <field :value="f" :context="context"></field>
               </div>
            </div>
         </div>
      </div>
   </div>
</template>

<script lang="ts">
   import { computed, defineComponent } from 'vue';
   import { ObjectValue, ResultContext } from './ResultObjects';
   import Field from './Field.vue';

   export default defineComponent({
      components: {
         Field,
      },
      props: {
         value: { type: Object as () => ObjectValue, required: true },
         context: { type: Object as () => ResultContext, required: true },
      },
      setup(props) {
         const toggleExpanded = () => {
            // eslint-disable-next-line vue/no-mutating-props
            props.value.state.expanded = !props.value.state.expanded;
         };

         const filteredFields = computed(() => {
            if (!props.context.hideEmpty) {
               return props.value.fields;
            }
            return props.value.fields.filter((f) => {
               if (f.value.type === 'object' && !f.value.fields.length) {
                  return false;
               }
               if (f.value.type === 'array' && !f.value.values.length) {
                  return false;
               }
               if (f.value.type === 'string' && !f.value.value) {
                  return false;
               }
               return true;
            });
         });

         return { toggleExpanded, filteredFields };
      },
   });
</script>
