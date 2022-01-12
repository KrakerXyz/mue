import { App } from 'vue';
import ConfirmationModalVue from './ConfirmationModal.vue';
import CreatedVue from './Created.vue';
import ModalVue from './Modal.vue';
import { resizableDirective } from './resizableDirective';
import SpinnerVue from './Spinner.vue';
import WidgetTemplateVue from './WidgetTemplate.vue';
import { valueVues } from './query-values';
import ConnectionBadgeVue from './ConnectionBadge.vue';
import AsyncListVue from './AsyncList.vue';

export function registerGlobalComponents(vueApp: App) {
   vueApp.component('v-spinner', SpinnerVue);
   vueApp.component('v-modal', ModalVue);
   vueApp.component('v-confirmation-modal', ConfirmationModalVue);
   vueApp.component('v-created', CreatedVue);
   vueApp.component('v-widget-template', WidgetTemplateVue);
   vueApp.component('v-connection-badge', ConnectionBadgeVue);
   vueApp.component('v-async-list', AsyncListVue);

   vueApp.directive('resizable', resizableDirective);

   for (const name of Object.getOwnPropertyNames(valueVues)) {
      vueApp.component(name, (valueVues as any)[name]);
   }
}