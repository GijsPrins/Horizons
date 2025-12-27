import { createI18n } from "vue-i18n";
import nl from "@/locales/nl.json";

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: "nl",
  fallbackLocale: "nl",
  messages: {
    nl,
  },
});
