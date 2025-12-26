// Vue Router configuration
import { createRouter, createWebHashHistory } from 'vue-router'
import { supabase } from '@/plugins/supabase'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/goals/:id',
      name: 'goal',
      component: () => import('@/views/GoalView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/teams',
      name: 'teams',
      component: () => import('@/views/TeamsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/teams/:id',
      name: 'team',
      component: () => import('@/views/TeamView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/celebration',
      name: 'celebration',
      component: () => import('@/views/CelebrationView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/views/HistoryView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard'
    }
  ]
})

// Navigation guards
router.beforeEach(async (to, _from, next) => {
  const { data: { session } } = await supabase.auth.getSession()
  const isAuthenticated = !!session

  // Redirect to login if route requires auth
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // Redirect to dashboard if route requires guest (login/register pages)
  if (to.meta.requiresGuest && isAuthenticated) {
    next({ name: 'dashboard' })
    return
  }

  // Check admin access
  if (to.meta.requiresAdmin && isAuthenticated) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_app_admin')
      .eq('id', session!.user.id)
      .single()

    if (!profile?.is_app_admin) {
      next({ name: 'dashboard' })
      return
    }
  }

  next()
})

export default router
