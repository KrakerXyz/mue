import { createApp } from 'vue';
import App from '@/components/App.vue';
import { registerGlobalComponents } from './components/global/registerGlobalComponents';

const vueApp = createApp(App);

registerGlobalComponents(vueApp);
vueApp.mount('#app');
