<script setup lang="ts">
import * as z from 'zod'
import { reactive, ref } from 'vue'
import type { FormSubmitEvent } from '@nuxt/ui'

import { useReadFireDoc } from '@/composables/firebase/useReadFireDoc'
import { useUpdateFireDoc } from '@/composables/firebase/useUpdateFireDoc'
import { useDeleteFireDoc } from '@/composables/firebase/useDeleteFireDoc'
import { useCreateFireDoc } from '@/composables/firebase/useCreateFireDoc'
import { useCreateIterations } from '@/composables/firebase/dedicated/useCreateIterations'
import { useSynthesisStore } from '@/stores/synthesisStore'
import { Timestamp } from 'firebase/firestore'
import type { DocumentData } from 'firebase/firestore'
import { useRouter } from 'vue-router'

const router = useRouter()
const fileRef = ref<HTMLInputElement>()
const { doRequest: getAccounts } = useReadFireDoc()
const { doRequest: updateTransaction } = useUpdateFireDoc()
const synthesisStore = useSynthesisStore()
const isCleaning = ref(false)
const isResetting = ref(false)
const { doRequest: deleteDoc } = useDeleteFireDoc()
const { doRequest: createDoc } = useCreateFireDoc()
const { doRequest: createIterations } = useCreateIterations()

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

const onSubmit = (_event: FormSubmitEvent<ProfileSchema>) => {
  toast.add({
    title: 'Profil mis à jour',
    description: 'Vos modifications ont été enregistrées avec succès.',
    icon: 'i-lucide-check',
    color: 'success'
  })
}

const resetUserData = async () => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer TOUTES vos données ? Cette action est irréversible.')) {
    return
  }

  isResetting.value = true
  try {
    const collections = ['accounts', 'recurringTransactions', 'iterations', 'transactions']
    let deleteCount = 0

    for (const collectionName of collections) {
      const docs = await getAccounts({ collectionName })
      if (Array.isArray(docs)) {
        for (const doc of docs) {
          await deleteDoc({ collectionName, documentId: doc.id })
          deleteCount++
        }
      }
    }

    toast.add({
      title: 'Réinitialisation terminée',
      description: `${deleteCount} documents ont été supprimés.`,
      icon: 'i-lucide-trash-2',
      color: 'success'
    })

    await synthesisStore.getRecurringTransactions()
    router.push('/onboarding')
  } catch (error: any) {
    toast.add({
      title: 'Erreur',
      description: error.message,
      icon: 'i-lucide-x',
      color: 'error'
    })
  } finally {
    isResetting.value = false
  }
}

const resetAndPopulateExamples = async () => {
  if (!confirm('Cela va supprimer TOUTES vos données actuelles et les remplacer par des exemples. Continuer ?')) {
    return
  }

  isResetting.value = true
  try {
    // 1. Delete everything
    const collections = ['accounts', 'recurringTransactions', 'iterations', 'transactions']
    for (const collectionName of collections) {
      const docs = await getAccounts({ collectionName })
      if (Array.isArray(docs)) {
        for (const doc of docs) {
          await deleteDoc({ collectionName, documentId: doc.id })
        }
      }
    }

    // 2. Create example accounts
    const mainAccountId = await createDoc({
      collectionName: 'accounts',
      data: { accountName: 'Compte Courant' },
      showToast: false
    })
    
    const savingAccountId = await createDoc({
      collectionName: 'accounts',
      data: { accountName: 'Livret A' },
      showToast: false
    })

    // 3. Create example transactions
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear() + 1, 11, 31)

    const examples = [
      { name: 'Salaire', amount: 2500, type: 'income', account: { label: 'Compte Courant', value: mainAccountId } },
      { name: 'Loyer', amount: 800, type: 'expense', account: { label: 'Compte Courant', value: mainAccountId } },
      { name: 'Abonnement Netflix', amount: 15, type: 'expense', account: { label: 'Compte Courant', value: mainAccountId } },
      { name: 'Courses', amount: 400, type: 'expense', account: { label: 'Compte Courant', value: mainAccountId } },
      { name: 'Virement Épargne', amount: 200, type: 'income', account: { label: 'Livret A', value: savingAccountId } },
      { name: 'Frais de gestion', amount: 2, type: 'expense', account: { label: 'Livret A', value: savingAccountId } }
    ]

    for (const ex of examples) {
      const transactionId = await createDoc({
        collectionName: 'recurringTransactions',
        data: {
          name: ex.name,
          amount: ex.amount,
          type: ex.type,
          account: ex.account,
          frequency: 'monthly',
          effectDate: Timestamp.fromDate(startDate),
          effectEndDate: Timestamp.fromDate(endDate)
        },
        showToast: false
      })

      await createIterations({
        transactionId,
        startDate,
        endDate,
        amount: ex.amount,
        name: ex.name,
        type: ex.type as 'income' | 'expense',
        frequency: 'monthly'
      })
    }

    toast.add({
      title: 'Exemples générés',
      description: 'Vos données ont été réinitialisées avec des exemples.',
      icon: 'i-lucide-sparkles',
      color: 'success'
    })

    await synthesisStore.getRecurringTransactions()
    router.push('/')
  } catch (error: any) {
    toast.add({
      title: 'Erreur',
      description: error.message,
      icon: 'i-lucide-x',
      color: 'error'
    })
  } finally {
    isResetting.value = false
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
      :title="$t('SettingsPage.maintenanceTitle')"
      :description="$t('SettingsPage.maintenanceDesc')"
      class="mt-8"
    >
      <div class="flex flex-col gap-4">
        <div class="flex justify-between items-center p-4 bg-muted/5 border border-default rounded-xl">
          <div>
            <p class="font-medium text-highlighted">{{ $t('SettingsPage.cleanAccountsTitle') }}</p>
            <p class="text-sm text-muted">{{ $t('SettingsPage.cleanAccountsDesc') }}</p>
          </div>
          <UButton 
            :label="$t('SettingsPage.cleanAccountsButton')" 
            icon="i-lucide-wand-2" 
            color="primary" 
            variant="subtle"
            :loading="isCleaning"
            @click="cleanTransactions"
          />
        </div>

        <USeparator />

        <div class="flex justify-between items-center p-4 bg-muted/5 border border-default rounded-xl">
          <div>
            <p class="font-medium text-highlighted">{{ $t('SettingsPage.exampleDataTitle') }}</p>
            <p class="text-sm text-muted">{{ $t('SettingsPage.exampleDataDesc') }}</p>
          </div>
          <UButton 
            :label="$t('SettingsPage.exampleDataButton')" 
            icon="i-lucide-sparkles" 
            color="primary" 
            variant="subtle"
            :loading="isResetting"
            @click="resetAndPopulateExamples"
          />
        </div>

        <USeparator />

        <div class="flex justify-between items-center p-4 bg-muted/5 border border-default rounded-xl">
          <div>
            <p class="font-medium text-highlighted">{{ $t('SettingsPage.onboardingTitle') }}</p>
            <p class="text-sm text-muted">{{ $t('SettingsPage.onboardingDesc') }}</p>
          </div>
          <UButton 
            :label="$t('SettingsPage.onboardingButton')" 
            icon="i-lucide-rocket" 
            color="primary" 
            variant="subtle"
            to="/onboarding"
          />
        </div>

        <USeparator />

        <div class="flex justify-between items-center p-4 bg-error/5 border border-error/20 rounded-xl">
          <div>
            <p class="font-medium text-error">{{ $t('SettingsPage.resetTitle') }}</p>
            <p class="text-sm text-muted">{{ $t('SettingsPage.resetDesc') }}</p>
          </div>
          <UButton 
            :label="$t('SettingsPage.resetButton')" 
            icon="i-lucide-trash-2" 
            color="error" 
            variant="subtle"
            :loading="isResetting"
            @click="resetUserData"
          />
        </div>
      </div>
    </UPageCard>
  </UForm>
</template>
