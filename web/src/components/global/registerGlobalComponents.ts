import { App } from 'vue';
import { resizableDirective } from './resizableDirective';

export function registerGlobalComponents(vueApp: App) {
   vueApp.component('v-spinner', () => import('@/components/global/Spinner.vue'));
   vueApp.component('v-modal', () => import('@/components/global/Modal.vue'));
   vueApp.component('v-confirmation-modal', () => import('@/components/global/ConfirmationModal.vue'));
   vueApp.component('v-created', () => import('@/components/global/Created.vue'));
   vueApp.directive('resizable', resizableDirective);
}