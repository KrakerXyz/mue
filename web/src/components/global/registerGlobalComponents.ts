import { App } from 'vue';
import ArrayValueVue from '../home/widgets/query/ArrayValue.vue';
import FieldVue from '../home/widgets/query/Field.vue';
import ObjectValueVue from '../home/widgets/query/ObjectValue.vue';
import StringValueVue from '../home/widgets/query/StringValue.vue';
import ConfirmationModalVue from './ConfirmationModal.vue';
import CreatedVue from './Created.vue';
import ModalVue from './Modal.vue';
import { resizableDirective } from './resizableDirective';
import SpinnerVue from './Spinner.vue';

export function registerGlobalComponents(vueApp: App) {
   vueApp.component('v-spinner', SpinnerVue);
   vueApp.component('v-modal', ModalVue);
   vueApp.component('v-confirmation-modal', ConfirmationModalVue);
   vueApp.component('v-created', CreatedVue);
   vueApp.directive('resizable', resizableDirective);
   vueApp.component('v-object-value', ObjectValueVue);
   vueApp.component('v-array-value', ArrayValueVue);
   vueApp.component('v-field', FieldVue);
   vueApp.component('v-string-value', StringValueVue);
}