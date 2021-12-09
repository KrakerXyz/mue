
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
   {
      name: 'home',
      path: '/',
      component: () => import('./components/home/Home.vue')
   },
];

export const router = createRouter({
   history: createWebHistory(),
   routes,
   linkActiveClass: 'active',
   linkExactActiveClass: 'active-exact',
});
