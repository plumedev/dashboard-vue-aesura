<script setup lang="ts">
import type { FormError } from '@nuxt/ui'
import { reactive } from 'vue'
import * as z from 'zod'

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

</script>

<template>
  <UPageCard
    :title="$t('SettingsSecurity.passwordTitle')"
    :description="$t('SettingsSecurity.passwordDesc')"
    variant="subtle"
  >
    <UForm
      :schema="passwordSchema"
      :state="password"
      :validate="validate"
      class="flex flex-col gap-4 max-w-xs"
    >
      <UFormField
        name="current"
      >
        <UInput
          v-model="password.current"
          type="password"
          :placeholder="$t('SettingsSecurity.currentPasswordPlaceholder')"
          class="w-full"
        />
      </UFormField>

      <UFormField
        name="new"
      >
        <UInput
          v-model="password.new"
          type="password"
          :placeholder="$t('SettingsSecurity.newPasswordPlaceholder')"
          class="w-full"
        />
      </UFormField>

      <UButton
        :label="$t('SettingsSecurity.update')"
        class="w-fit"
        type="submit"
      />
    </UForm>
  </UPageCard>

  <UPageCard
    :title="$t('SettingsSecurity.accountTitle')"
    :description="$t('SettingsSecurity.accountDesc')"
    class="bg-gradient-to-tl from-error/10 from-5% to-default"
  >
    <template
      #footer
    >
      <UButton
        :label="$t('SettingsSecurity.deleteAccount')"
        color="error"
      />
    </template>
  </UPageCard>
</template>
