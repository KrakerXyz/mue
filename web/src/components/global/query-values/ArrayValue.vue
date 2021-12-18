<template>
   <div>
      <div class="row g-2">
         <div class="col-auto text-primary d-flex align-items-center" role="button" @click="contextManager.togglePathExpanded(basePath, resultIndex)">
            <i class="fas fa-brackets fa-fw"></i>
         </div>
         <div class="col text-truncate" v-if="!isExpanded">
            <span class="align-text-bottom">{{ contextManager.getSummaryHtml(value, basePath) }}</span>
         </div>
         <div class="col-auto">
            <span class="text-muted small">{{ value.length }} element{{ !value.length || value.length > 1 ? 's' : '' }}</span>
         </div>
      </div>

      <div v-if="isExpanded" class="row">
         <div class="col overflow-hidden">
            <div class="list-group list-group-flush">
               <div class="list-group-item" v-for="(f, index) of items" :key="index">
                  <component :is="f.type" :contextManager="contextManager" :resultIndex="resultIndex" :value="f.value" :basePath="f.path"></component>
               </div>
            </div>
         </div>
      </div>
   </div>
</template>

<script lang="ts">
   import { computed, defineComponent } from 'vue';
   import { ResultContextManager } from '@/services';
   import { getValueType, ValueType } from '.';

   export default defineComponent({
      props: {
         value: { type: Array as () => any[], required: true },
         resultIndex: { type: Number, required: true },
         basePath: { type: String, required: true },
         contextManager: { type: Object as () => ResultContextManager, required: true },
      },
      setup(props) {
         const items = computed(() => {
            const vms: ItemVm[] = [];

            for (let i = 0; i < props.value.length; i++) {
               const value = props.value[i];

               const f: ItemVm = {
                  type: getValueType(value),
                  value,
                  path: `${props.basePath}[${i}]`,
               };

               vms.push(f);
            }

            return vms;
         });

         const isExpanded = computed(() => props.contextManager.isExpanded(props.basePath, props.resultIndex));

         return { items, isExpanded };
      },
   });

   interface ItemVm {
      type: ValueType;
      value: any;
      path: string;
   }
</script>
