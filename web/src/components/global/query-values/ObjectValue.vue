<template>
   <div>
      <div class="row g-2">
         <div class="col-auto text-success" role="button" @click="contextManager.togglePathExpanded(basePath, resultIndex)">
            <i class="fas fa-brackets-curly fa-fw"></i>
         </div>
         <div class="col text-truncate" v-if="!isExpanded">
            <span class="align-text-bottom" v-text="contextManager.getSummaryText(value, basePath)"></span>
         </div>
         <div class="col-auto">
            <span class="text-muted small">{{ fields.length }} field{{ !fields.length || fields.length > 1 ? 's' : '' }}</span>
         </div>
      </div>
      <div class="list-group list-group-flush" v-if="isExpanded">
         <div class="list-group-item" v-for="field of fields" :key="field.name">
            <div class="row">
               <div class="col-4 col-md-3 col-lg-2 text-truncate" :title="field.path">
                  <span class="text-muted small" role="button" @click="contextManager.toggleHidePath(field.path)"><i class="fal fa-eye-slash"></i></span>
                  {{ field.name }}
               </div>
               <div class="col text-truncate">
                  <component
                     :is="field.type"
                     :contextManager="contextManager"
                     :resultIndex="resultIndex"
                     :value="field.value"
                     :basePath="field.path"
                  ></component>
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
         value: { type: Object as () => Record<string, any>, required: true },
         resultIndex: { type: Number, required: true },
         basePath: { type: String, required: true },
         contextManager: { type: Object as () => ResultContextManager, required: true },
      },
      setup(props) {
         const fields = computed(() => {
            const vms: FieldVm[] = [];

            const fieldNames = Object.keys(props.value);
            if (props.contextManager.context.sortFields) {
               fieldNames.sort((a, b) => a.localeCompare(b));
            }

            for (const name of fieldNames) {
               const value = props.value[name];

               const fieldPath = `${props.basePath}${props.basePath ? '.' : ''}${name}`;

               if (!props.contextManager.isVisible(fieldPath, value)) {
                  continue;
               }

               const f: FieldVm = {
                  name,
                  type: getValueType(value),
                  value,
                  path: fieldPath,
               };

               vms.push(f);
            }

            return vms;
         });

         const isExpanded = computed(() => props.contextManager.isExpanded(props.basePath, props.resultIndex));

         return { fields, isExpanded };
      },
   });

   interface FieldVm {
      name: string;
      type: ValueType;
      value: any;
      path: string;
   }
</script>
