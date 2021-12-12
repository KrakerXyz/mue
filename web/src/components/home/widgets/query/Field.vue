<template>
   <div class="row">
      <div class="col-4 col-md-3 col-lg-1 text-truncate" :title="value.key">
         <span class="text-muted small" role="button" @click="hideField()"><i class="fal fa-eye-slash"></i></span> {{ value.key }}
      </div>
      <div v-if="!value.value.component" class="col text-truncate">
         {{ value.value.formattedJson }}
      </div>
      <div v-if="value.value.component" class="col text-truncate">
         <component :is="value.value.component" :value="value.value" :context="context"></component>
      </div>
   </div>
</template>

<script lang="ts">
   import { defineComponent } from 'vue';
   import { Field, ResultContext } from './ResultObjects';

   export default defineComponent({
      props: {
         value: { type: Object as () => Field, required: true },
         context: { type: Object as () => ResultContext, required: true },
      },
      setup(props) {
         const hideField = () => {
            // eslint-disable-next-line vue/no-mutating-props
            props.context.hidePaths.push(props.value.path);
         };
         return { hideField };
      },
   });
</script>
