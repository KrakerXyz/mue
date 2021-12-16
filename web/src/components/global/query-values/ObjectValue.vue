<template>
   <div>
      <div class="row g-2">
         <div class="col-auto text-success" role="button" @click="contextManager.togglePathExpanded(basePath, resultIndex)">
            <i class="fas fa-brackets-curly fa-fw"></i>
         </div>
         <div class="col text-truncate" v-if="!isExpanded" v-html="contextManager.getSummaryHtml(value, basePath)"></div>
         <div class="col-auto">
            <span class="text-muted small">{{ fields.length }} fields</span>
         </div>
      </div>
      <template v-if="isExpanded">
         <div class="row" v-for="field of fields" :key="field.name">
            <div class="col-4 col-md-3 col-lg-2 text-truncate" :title="field.path">
               <span class="text-muted small ps-3" role="button"><i class="fal fa-eye-slash"></i></span> {{ field.name }}
            </div>
            <div class="col text-truncate">
               <component
                  :is="`v-${field.type}-value`"
                  :contextManager="contextManager"
                  :resultIndex="resultIndex"
                  :value="field.value"
                  :basePath="field.path"
               ></component>
            </div>
         </div>
      </template>
   </div>
</template>

<script lang="ts">
   import { computed, defineComponent } from 'vue';
   import { ResultContextManager } from '@/components/widgets/Query.vue';

   export default defineComponent({
      props: {
         value: { type: Object as () => Record<string, any>, required: true },
         resultIndex: { type: Number, required: true },
         basePath: { type: String, required: true },
         contextManager: { type: Object as () => ResultContextManager, required: true },
      },
      setup(props) {
         const fields = computed(() => {
            const vms: FieldVm[] = [];

            for (const name of Object.getOwnPropertyNames(props.value)) {
               const value = props.value[name];

               const isArray = Array.isArray(value);
               let type = typeof value;

               if (props.contextManager.context.hideEmpty) {
                  if (!value) {
                     continue;
                  }

                  if (isArray && value.length === 0) {
                     continue;
                  }
               }

               if (type === 'symbol' || type === 'function' || type === 'undefined') {
                  type = 'string';
               } else if (type === 'bigint') {
                  type = 'number';
               }

               const f: FieldVm = {
                  name,
                  type: isArray ? 'array' : type,
                  value,
                  path: `${props.basePath}.${name}`,
               };
               if (f.path.startsWith('.')) {
                  f.path = f.path.substring(1);
               }

               vms.push(f);
            }

            return vms;
         });

         const isExpanded = props.contextManager.useIsExpanded(props.basePath, props.resultIndex);

         return { fields, isExpanded };
      },
   });

   interface FieldVm {
      name: string;
      type: 'string' | 'object' | 'array' | 'number' | 'boolean';
      value: any;
      path: string;
   }
</script>
