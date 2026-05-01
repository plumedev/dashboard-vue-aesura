<script setup lang="ts">
import * as z from 'zod'
import { reactive, ref } from 'vue'
import type { FormSubmitEvent } from '@nuxt/ui'

import { useReadFireDoc } from '@/composables/firebase/useReadFireDoc'
import { useUpdateFireDoc } from '@/composables/firebase/useUpdateFireDoc'
import { useSynthesisStore } from '@/stores/synthesisStore'
import type { DocumentData } from 'firebase/firestore'

const fileRef = ref<HTMLInputElement>()
const { doRequest: getAccounts } = useReadFireDoc()
const { doRequest: updateTransaction } = useUpdateFireDoc()
const synthesisStore = useSynthesisStore()
const isCleaning = ref(false)

const profileSchema = z.object({
  name: z.string().min(2, 'Too short'),
  email: z.string().email('Invalid email'),
  username: z.string().min(2, 'Too short'),
  avatar: z.string().optional(),
  bio: z.string().optional()
})

type ProfileSchema = z.output<typeof profileSchema>

const profile = reactive<Partial<ProfileSchema>>({
  name: 'Benjamin Canac',
  email: 'ben@nuxtlabs.com',
  username: 'benjamincanac',
  avatar: undefined,
  bio: undefined
})
const toast = useToast()

const cleanTransactions = async () => {
  isCleaning.value = true
  try {
    // 1. Récupérer les comptes existants
    const accountsResult = await getAccounts({ collectionName: 'accounts' })
    if (!accountsResult || !Array.isArray(accountsResult)) {
      throw new Error('Impossible de récupérer les comptes')
    }
    const accounts = accountsResult as DocumentData[]

    // 2. Récupérer toutes les transactions récurrentes
    await synthesisStore.getRecurringTransactions()
    const recurringTransactions = synthesisStore.recurringTransactions

    // 3. Récupérer les transactions ponctuelles
    const oneTimeTransactionsResult = await getAccounts({ collectionName: 'transactions' })
    const oneTimeTransactions = Array.isArray(oneTimeTransactionsResult) ? oneTimeTransactionsResult : []

    let updateCount = 0

    // 4. Fonction utilitaire de nettoyage
    const processTransactions = async (list: DocumentData[], collectionName: string) => {
      for (const transaction of list) {
        let rawAccount = transaction.account?.label || transaction.account
        let currentAccountLabel = typeof rawAccount === 'string' ? rawAccount : ''
        let needsUpdate = false
        let targetAccount: DocumentData | null = null

        if (!currentAccountLabel) {
          targetAccount = accounts.find(a => a.accountName.toUpperCase() === 'CIC') || accounts[0]
          needsUpdate = true
        } else {
          const match = accounts.find(a => a.accountName.toLowerCase() === currentAccountLabel.toLowerCase())
          if (match && match.accountName !== currentAccountLabel) {
            targetAccount = match
            needsUpdate = true
          }
        }

        if (needsUpdate && targetAccount) {
          await updateTransaction({
            collectionName,
            documentId: transaction.id,
            data: {
              account: {
                label: targetAccount.accountName,
                value: targetAccount.accountName
              }
            }
          })
          updateCount++
        }
      }
    }

    // 5. Lancer le nettoyage sur les deux collections
    await processTransactions(recurringTransactions, 'recurringTransactions')
    await processTransactions(oneTimeTransactions, 'transactions')

    toast.add({
      title: 'Nettoyage terminé',
      description: `${updateCount} transactions ont été mises à jour.`,
      icon: 'i-lucide-check',
      color: 'success'
    })
    
    // Rafraîchir les données
    await synthesisStore.getRecurringTransactions()
  } catch (error: any) {
    toast.add({
      title: 'Erreur',
      description: error.message,
      icon: 'i-lucide-x',
      color: 'error'
    })
  } finally {
    isCleaning.value = false
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement

  if (!input.files?.length) {
    return
  }

  profile.avatar = URL.createObjectURL(input.files[0])
}

function onFileClick() {
  fileRef.value?.click()
}
</script>

<template>
  <UForm
    id="settings"
    :schema="profileSchema"
    :state="profile"
    @submit="onSubmit"
  >
    <UPageCard
      :title="$t('SettingsProfile.title')"
      :description="$t('SettingsProfile.description')"
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        form="settings"
        :label="$t('SettingsProfile.saveChanges')"
        color="neutral"
        type="submit"
        class="w-fit lg:ms-auto"
      />
    </UPageCard>

    <UPageCard
      variant="subtle"
    >
      <UFormField
        name="name"
        :label="$t('SettingsProfile.name')"
        :description="$t('SettingsProfile.nameDesc')"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="profile.name"
          autocomplete="off"
        />
      </UFormField>
      <USeparator />
      <UFormField
        name="email"
        :label="$t('SettingsProfile.email')"
        :description="$t('SettingsProfile.emailDesc')"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="profile.email"
          type="email"
          autocomplete="off"
        />
      </UFormField>
      <USeparator />
      <UFormField
        name="username"
        :label="$t('SettingsProfile.username')"
        :description="$t('SettingsProfile.usernameDesc')"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="profile.username"
          type="username"
          autocomplete="off"
        />
      </UFormField>
      <USeparator />
      <UFormField
        name="avatar"
        :label="$t('SettingsProfile.avatar')"
        description="JPG, GIF or PNG. 1MB Max."
        class="flex max-sm:flex-col justify-between sm:items-center gap-4"
      >
        <div
          class="flex flex-wrap items-center gap-3"
        >
          <UAvatar
            :src="profile.avatar"
            :alt="profile.name"
            size="lg"
          />
          <UButton
            :label="$t('SettingsProfile.choose')"
            color="neutral"
            @click="onFileClick"
          />
          <input
            ref="fileRef"
            type="file"
            class="hidden"
            accept=".jpg, .jpeg, .png, .gif"
            @change="onFileChange"
          >
        </div>
      </UFormField>
      <USeparator />
      <UFormField
        name="bio"
        :label="$t('SettingsProfile.bio')"
        :description="$t('SettingsProfile.bioDesc')"
        class="flex max-sm:flex-col justify-between items-start gap-4"
        :ui="{ container: 'w-full' }"
      >
        <UTextarea
          v-model="profile.bio"
          :rows="5"
          autoresize
          class="w-full"
        />
      </UFormField>
    </UPageCard>

    <UPageCard
      title="Maintenance des données"
      description="Outils de nettoyage et d'harmonisation de la base de données."
      class="mt-8"
    >
      <div class="flex flex-col gap-4">
        <div class="flex justify-between items-center p-4 bg-muted/5 border border-default rounded-xl">
          <div>
            <p class="font-medium text-highlighted">Harmonisation des comptes</p>
            <p class="text-sm text-muted">Corrige les noms de comptes dans les transactions et assigne un compte par défaut (CIC) si manquant.</p>
          </div>
          <UButton 
            label="Lancer le nettoyage" 
            icon="i-lucide-wand-2" 
            color="primary" 
            variant="subtle"
            :loading="isCleaning"
            @click="cleanTransactions"
          />
        </div>
      </div>
    </UPageCard>
  </UForm>
</template>
