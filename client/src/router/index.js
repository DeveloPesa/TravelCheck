import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import AuthView from '../views/AuthView.vue';
import DashboardView from '../views/DashboardView.vue';
import TripDetailView from '../views/TripDetailView.vue';
import StatsView from '../views/StatsView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: AuthView },
    { path: '/', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/trips/:id', name: 'trip-detail', component: TripDetailView, meta: { requiresAuth: true } },
    { path: '/stats', name: 'stats', component: StatsView, meta: { requiresAuth: true } }
  ]
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' };
  }

  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'dashboard' };
  }

  return true;
});

export default router;
