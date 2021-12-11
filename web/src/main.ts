import { createApp } from 'vue';
import { router } from './main.router';
import App from '@/components/App.vue';
import { registerGlobalComponents } from './components/global/registerGlobalComponents';

const vueApp = createApp(App);

registerGlobalComponents(vueApp);

vueApp.use(router); //Needs come be inside the authorized section or the guards will cause a redirect 

vueApp.mount('#app');
