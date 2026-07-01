import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../pages/HomePage.vue'),
    },
    {
      path: '/gate',
      name: 'gate',
      component: () => import('../pages/GatePage.vue'),
    },
    {
      path: '/messages',
      name: 'messages',
      component: () => import('../pages/MessagesPage.vue'),
    },
    {
      path: '/author/login',
      name: 'author-login',
      component: () => import('../pages/AuthorLoginPage.vue'),
    },
    {
      path: '/card/:id', name: 'card-detail', component: () => import('../pages/CardDetailPage.vue') }, {
    path: '/create', name: 'create-card', component: () => import('../pages/CreateCardPage.vue') }, {
    path: '/manage/:id', name: 'manage-card', component: () => import('../pages/ManageCardPage.vue') },
    {
      path: '/author/questions',
      name: 'author-questions',
      component: () => import('../pages/AuthorQuestionsPage.vue'),
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('../pages/StatsPage.vue'),
    },
  ],
})

router.onError((error) => {
  console.error('[Router Error]', error)
})

export default router
