import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Utilise jsdom pour simuler un navigateur (nécessaire pour les composants Vue)
      environment: 'jsdom',

      // Pattern de fichiers de test
      include: ['src/**/*.{test,spec}.{js,ts}'],

      // Fichier de setup global (optionnel, utile pour des mocks globaux)
      // setupFiles: ['./src/tests/setup.ts'],

      // Rapports de couverture de code
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/helpers/**', 'src/composables/**', 'src/pages/**'],
      },

      // Active les globaux (describe, it, expect sans imports)
      globals: true,
    },
  })
)
