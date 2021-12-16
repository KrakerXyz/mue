import BooleanValueVue from './BooleanValue.vue';
import NumberValueVue from './NumberValue.vue';
import ObjectValueVue from './ObjectValue.vue';
import StringValueVue from './StringValue.vue';

export const valueVues = {
   'v-object-value': ObjectValueVue,
   'v-string-value': StringValueVue,
   'v-number-value': NumberValueVue,
   'v-boolean-value': BooleanValueVue
};