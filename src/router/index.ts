// Vue Router configuration
import { createRouter, createWebHashHistory } from "vue-router";
import { useAuth } from "@/composables/useAuth";

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/dashboard",
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/auth/LoginView.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("@/views/auth/RegisterView.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/forgot-password",
      name: "forgot-password",
      component: () => import("@/views/auth/ForgotPasswordView.vue"),
      meta: { requiresGuest: true },
    },
    {
      path: "/reset-password",
      name: "reset-password",
      component: () => import("@/views/auth/ResetPasswordView.vue"),
      meta: { requiresAuth: true }, // Auth is handled by the magic link token
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: () => import("@/views/DashboardView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/goals/:id",
      name: "goal",
      component: () => import("@/views/GoalView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/teams",
      name: "teams",
      component: () => import("@/views/TeamsView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/teams/:id",
      name: "team",
      component: () => import("@/views/TeamView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/celebration",
      name: "celebration",
      component: () => import("@/views/CelebrationView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/history",
      name: "history",
      component: () => import("@/views/HistoryView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/settings",
      name: "settings",
      component: () => import("@/views/SettingsView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/admin",
      name: "admin",
      component: () => import("@/views/AdminView.vue"),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/dashboard",
    },
  ],
});

// Navigation guards
router.beforeEach(async (to, _from, next) => {
  const { isAuthenticated, isAdmin } = useAuth();

  // Redirect to login if route requires auth
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next({ name: "login", query: { redirect: to.fullPath } });
    return;
  }

  // Redirect to dashboard if route requires guest (login/register pages)
  if (to.meta.requiresGuest && isAuthenticated.value) {
    next({ name: "dashboard" });
    return;
  }

  // Check admin access
  if (to.meta.requiresAdmin && !isAdmin.value) {
    next({ name: "dashboard" });
    return;
  }

  next();
});

export default router;
