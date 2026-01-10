import { createI18n } from "vue-i18n";

const messages = {
  en: {
    GlobalErrorMessage: {
      errorMessage: "An error occurred. Please try again.",
    },
  },
  fr: {
    GlobalErrorMessage: {
      errorMessage: "Une erreur est survenue. Veuillez réessayer.",
    },
  },
};

export const i18n = createI18n({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages,
});
