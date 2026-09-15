import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'
import EventDetailPage from '../views/EventDetailPage.vue'
import EventFormPage from '../views/EventFormPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/home'
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/home'
      },
      {
        path: 'home',
        name: 'Home',
        component: () => import('../views/HomePage.vue')
      },
      {
        path: 'calendar',
        name: 'Calendar',
        component: () => import('../views/CalendarPage.vue')
      }
    ]
  },
  {
    path: '/event/new',
    name: 'EventNew',
    component: EventFormPage
  },
  {
    path: '/event/:id',
    name: 'EventDetail',
    component: EventDetailPage
  },
  {
    path: '/event/:id/edit',
    name: 'EventEdit',
    component: EventFormPage
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router