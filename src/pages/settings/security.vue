<script setup lang="ts">
import * as z from 'zod'
import { reactive, ref } from 'vue'
import type { FormError } from '@nuxt/ui'
import { useMigrateTransactionDates } from '@/composables/firebase/dedicated/useMigrateTransactionDates'
import type { MigrationResult } from '@/composables/firebase/dedicated/useMigrateTransactionDates'

const passwordSchema = z.object({
  current: z.string().min(8, 'Must be at least 8 characters'),
  new: z.string().min(8, 'Must be at least 8 characters')
})

type PasswordSchema = z.output<typeof passwordSchema>

const password = reactive<Partial<PasswordSchema>>({
  current: undefined,
  new: undefined
})

const validate = (state: Partial<PasswordSchema>): FormError[] => {
  const errors: FormError[] = []
  if (state.current && state.new && state.current === state.new) {
    errors.push({ name: 'new', message: 'Passwords must be different' })
  }
  return errors
}

// Migration des dates
const { migrate } = useMigrateTransactionDates()
const isMigrating = ref(false)
const migrationResult = ref<MigrationResult | null>(null)

const handleMigration = async () => {
  if (!confirm('⚠️ Êtes-vous sûr de vouloir lancer la migration des dates ?\n\nCette action va convertir toutes les dates string (format "2026-01-30") en Timestamp Firebase pour les champs effectDate et effectEndDate.\n\nCette action est irréversible.')) {
    return
  }

  isMigrating.value = true
  migrationResult.value = null

  try {
    const result = await migrate()
    migrationResult.value = result
  } catch (error) {
    console.error('Erreur lors de la migration:', error)
  } finally {
    isMigrating.value = false
  }
}
</script>

<template>
  <UPageCard
    title="Password"
    description="Confirm your current password before setting a new one."
    variant="subtle"
  >
    <UForm
      :schema="passwordSchema"
      :state="password"
      :validate="validate"
      class="flex flex-col gap-4 max-w-xs"
    >
      <UFormField name="current">
        <UInput
          v-model="password.current"
          type="password"
          placeholder="Current password"
          class="w-full"
        />
      </UFormField>

      <UFormField name="new">
        <UInput
          v-model="password.new"
          type="password"
          placeholder="New password"
          class="w-full"
        />
      </UFormField>

      <UButton label="Update" class="w-fit" type="submit" />
    </UForm>
  </UPageCard>

  <UPageCard
    title="Migration des dates (DEV)"
    description="Convertit les dates string (format '2026-01-30') en Timestamp Firebase pour les champs effectDate et effectEndDate des transactions. Cette action est irréversible."
    variant="subtle"
    class="border-warning/20"
  >
    <template #footer>
      <div class="flex flex-col gap-4">
        <UButton
          label="Lancer la migration"
          color="warning"
          :loading="isMigrating"
          @click="handleMigration"
        />

        <div v-if="migrationResult" class="mt-4 p-4 rounded-lg bg-elevated">
          <h3 class="font-semibold mb-2">Résultat de la migration</h3>
          <div class="space-y-1 text-sm">
            <p><strong>Total:</strong> {{ migrationResult.total }} document(s)</p>
            <p class="text-success"><strong>Mis à jour:</strong> {{ migrationResult.updated }} document(s)</p>
            <p class="text-dimmed"><strong>Ignorés:</strong> {{ migrationResult.skipped }} document(s)</p>
            <p v-if="migrationResult.errors.length > 0" class="text-error">
              <strong>Erreurs:</strong> {{ migrationResult.errors.length }} erreur(s)
            </p>
          </div>

          <div v-if="migrationResult.errors.length > 0" class="mt-4">
            <h4 class="font-medium mb-2 text-error">Détails des erreurs:</h4>
            <ul class="list-disc list-inside space-y-1 text-sm">
              <li v-for="(error, index) in migrationResult.errors" :key="index">
                Document {{ error.documentId }}: {{ error.error }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>
  </UPageCard>

  <UPageCard
    title="Account"
    description="No longer want to use our service? You can delete your account here. This action is not reversible. All information related to this account will be deleted permanently."
    class="bg-gradient-to-tl from-error/10 from-5% to-default"
  >
    <template #footer>
      <UButton label="Delete account" color="error" />
    </template>
  </UPageCard>
</template>
