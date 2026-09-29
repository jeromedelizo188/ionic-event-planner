import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import CipherPage from '../views/CipherPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Cipher',
    component: CipherPage
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
