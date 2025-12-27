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
  await initialize();

  const app = createApp(App);

  app.use(router);
  app.use(vuetify);
  app.use(i18n);
  setupVueQuery(app);

  app.mount("#app");
}

bootstrap();
