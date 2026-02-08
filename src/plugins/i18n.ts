import { createI18n } from 'vue-i18n'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const messages: Record<string, any> = {
  en: {
    GlobalErrorMessage: {
      errorMessage: 'An error occurred. Please try again.',
    },
  },
  fr: {
    GlobalErrorMessage: {
      errorMessage: 'Une erreur est survenue. Veuillez réessayer.',
    },
  },
}

const localeFiles = import.meta.glob(['../components/**/locales/*.json', '../locales/*.json'], {
  eager: true,
}) as Record<string, { default: unknown }>

for (const path in localeFiles) {
  const locale = path.split('/').pop()?.split('.')[0]
  if (locale) {
    messages[locale] = messages[locale] || {}
    Object.assign(messages[locale], localeFiles[path].default as object)
  }
}

export const i18n = createI18n({
  legacy: false,
  locale: 'fr',
  fallbackLocale: 'fr',
  globalInjection: true,
  messages,
})
