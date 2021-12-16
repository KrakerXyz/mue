import { App } from 'vue';
import ConfirmationModalVue from './ConfirmationModal.vue';
import CreatedVue from './Created.vue';
import ModalVue from './Modal.vue';
import { resizableDirective } from './resizableDirective';
import SpinnerVue from './Spinner.vue';
import WidgetTemplateVue from './WidgetTemplate.vue';

export function registerGlobalComponents(vueApp: App) {
   vueApp.component('v-spinner', SpinnerVue);
   vueApp.component('v-modal', ModalVue);
   vueApp.component('v-confirmation-modal', ConfirmationModalVue);
   vueApp.component('v-created', CreatedVue);
   vueApp.component('v-widget-template', WidgetTemplateVue);
   vueApp.directive('resizable', resizableDirective);
}