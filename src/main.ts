import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import { setupVueQuery } from "./plugins/vueQuery";
import { i18n } from "./plugins/i18n";
import { useAuth } from "./composables/useAuth";

// Initialize auth before mounting to ensure it's ready for router guards
const { initialize } = useAuth();

async function bootstrap() {
  try {
    await initialize();
  } catch (error) {
    console.error("Failed to initialize auth:", error);
    // Continue rendering even if auth fails, the router guards will handle the rest
    // or the app will show a restricted state
  }

  const app = createApp(App);

  app.use(router);
  app.use(vuetify);
  app.use(i18n);
  setupVueQuery(app);

  app.mount("#app");
}

bootstrap();
