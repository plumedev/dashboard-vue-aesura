<template>
  <UDashboardPanel id="onboarding" class="h-screen overflow-hidden">
    <template #header>
      <UDashboardNavbar :title="$t('OnboardingPage.title')">
        <template #right>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted">Étape {{ currentStep }} sur 3</span>
            <UProgress :value="(currentStep / 3) * 100" size="sm" class="w-32" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col md:flex-row h-full min-h-0 overflow-hidden">
        <!-- Left Part: Stepper -->
        <div class="w-full md:w-1/3 min-w-[450px] p-8 md:p-12 bg-[#121212] border-r border-default flex flex-col overflow-hidden relative">
          <!-- Welcome Message -->
          <div class="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 mb-12">
            <UIcon name="i-lucide-info" class="w-6 h-6 text-white shrink-0" />
            <p class="text-sm text-white/80 leading-relaxed">
              Bienvenue dans l'assistant de configuration. Quelques étapes vous permettront de fournir des informations nécessaires au bon fonctionnement de Aesura
            </p>
          </div>

          <!-- Vertical Stepper -->
          <div class="flex-1 space-y-0 relative ml-4">
            <!-- Step 1 -->
            <div class="relative flex gap-6 pb-12 items-start group">
              <!-- Connecting Line -->
              <div class="absolute left-6 top-12 bottom-0 w-px border-l border-dashed border-white/20 -z-0"></div>
              
              <div :class="`z-10 flex items-center justify-center w-12 h-12 rounded-full shrink-0 transition-all duration-500 ${currentStep >= 1 ? 'bg-primary text-black' : 'bg-white/10 text-white/40'}`">
                <UIcon name="i-lucide-piggy-bank" class="w-6 h-6" />
              </div>
              <div class="space-y-1">
                <h3 :class="`text-xl font-bold transition-colors ${currentStep === 1 ? 'text-white' : 'text-white/40'}`">
                  Personnalisez et ajoutez des comptes
                </h3>
                <p :class="`text-sm leading-relaxed transition-colors ${currentStep === 1 ? 'text-white/60' : 'text-white/20'}`">
                  Donnez un nom à votre compte principal et ajoutez autant de compte que vous le souhaitez.
                </p>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="relative flex gap-6 pb-12 items-start group">
              <!-- Connecting Line -->
              <div class="absolute left-6 top-12 bottom-0 w-px border-l border-dashed border-white/20 -z-0"></div>

              <div :class="`z-10 flex items-center justify-center w-12 h-12 rounded-full shrink-0 transition-all duration-500 ${currentStep >= 2 ? 'bg-primary text-black' : 'bg-white text-black opacity-90'}`">
                <UIcon name="i-lucide-receipt" class="w-6 h-6" />
              </div>
              <div class="space-y-1">
                <h3 :class="`text-xl font-bold transition-colors ${currentStep === 2 ? 'text-white' : 'text-white/40'}`">
                  Ajoutez vos charges fixes
                </h3>
                <p :class="`text-sm leading-relaxed transition-colors ${currentStep === 2 ? 'text-white/60' : 'text-white/20'}`">
                  Listez vos charges fixes et dépenses récurrentes pour définir la part de votre budget incompressible.
                </p>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="relative flex gap-6 pb-12 items-start group">
              <div :class="`z-10 flex items-center justify-center w-12 h-12 rounded-full shrink-0 transition-all duration-500 ${currentStep >= 3 ? 'bg-primary text-black' : 'bg-white text-black opacity-90'}`">
                <UIcon name="i-lucide-wallet" class="w-6 h-6" />
              </div>
              <div class="space-y-1">
                <h3 :class="`text-xl font-bold transition-colors ${currentStep === 3 ? 'text-white' : 'text-white/40'}`">
                  Ajoutez vos revenus
                </h3>
                <p :class="`text-sm leading-relaxed transition-colors ${currentStep === 3 ? 'text-white/60' : 'text-white/20'}`">
                  Listez vos revenus récurrents comme votre salaire.
                </p>
              </div>
            </div>
          </div>

          <!-- Navigation Buttons (Bottom) -->
          <div class="flex items-center gap-4 pt-8 mt-auto">
            <UButton 
              v-if="currentStep > 1" 
              icon="i-lucide-arrow-left" 
              variant="ghost" 
              color="neutral" 
              size="lg"
              @click="currentStep--"
            >
              {{ $t('OnboardingPage.previous') }}
            </UButton>
            <UButton 
              class="ml-auto"
              :icon="currentStep === 3 ? 'i-lucide-check' : 'i-lucide-arrow-right'" 
              color="primary" 
              size="lg"
              @click="handleNext"
            >
              {{ currentStep === 3 ? $t('OnboardingPage.finish') : $t('OnboardingPage.next') }}
            </UButton>
          </div>

          <!-- Decorative Chart (Bottom) -->
          <div class="absolute bottom-0 left-0 right-0 h-48 pointer-events-none opacity-20 -z-0">
            <div class="w-full h-full bg-gradient-to-t from-primary/20 to-transparent"></div>
            <UIcon name="i-lucide-trending-up" class="absolute bottom-4 left-4 w-64 h-64 text-primary/10 -rotate-12" />
          </div>
        </div>

        <!-- Right Part: Form and List -->
        <div class="flex-1 flex flex-col min-h-0 bg-background/50">
          <div class="p-8 md:p-12 space-y-8 flex-1 flex flex-col min-h-0 max-w-6xl mx-auto w-full">
            
            <!-- Form Section -->
            <div class="bg-elevated border border-default p-6 rounded-2xl shadow-sm flex-shrink-0">
              <h3 class="text-xl font-semibold mb-6 flex items-center gap-2">
                <UIcon :name="currentStep === 1 ? 'i-lucide-wallet' : (currentStep === 2 ? 'i-lucide-arrow-down-right' : 'i-lucide-arrow-up-right')" 
                       :class="currentStep === 1 ? 'text-primary' : (currentStep === 2 ? 'text-error' : 'text-success')" />
                {{ currentStep === 1 ? 'Ajouter un nouveau compte' : (currentStep === 2 ? 'Nouvelle dépense récurrente' : 'Nouveau revenu récurrent') }}
              </h3>
              
              <UForm v-if="currentStep === 1" :state="accountForm" class="flex gap-3 items-end" @submit="addAccount">
                <UFormField label="Nom du compte" class="flex-1">
                  <UInput v-model="accountForm.accountName" placeholder="Ex: Compte Courant" size="lg" />
                </UFormField>
                <UButton type="submit" icon="i-lucide-plus" size="lg" :loading="isCreatingAccount" />
              </UForm>

              <TransactionForm 
                v-else 
                ref="transactionFormRef"
                :account-options="accountOptions" 
                :loading="isCreatingTransaction"
                :initial-type="currentStep === 2 ? 'expense' : 'income'"
                @submit="addTransaction"
              />
            </div>

            <!-- List Section (Table) -->
            <div class="flex-1 flex flex-col min-h-0 bg-elevated/50 border border-default rounded-2xl overflow-hidden">
              <div class="p-4 border-b border-default bg-elevated/50 flex items-center justify-between">
                <h4 class="font-bold text-highlighted uppercase text-xs tracking-wider">
                  {{ currentStep === 1 ? 'Vos comptes' : (currentStep === 2 ? 'Vos dépenses' : 'Vos revenus') }}
                </h4>
                <UBadge variant="subtle" size="sm" color="neutral">
                  {{ currentStep === 1 ? accounts.length : filteredTransactions.length }} {{ currentStep === 1 ? 'comptes' : 'items' }}
                </UBadge>
              </div>

              <div class="flex-1 overflow-auto">
                <UTable 
                  v-if="currentStep === 1" 
                  :data="accounts" 
                  :columns="accountColumns" 
                  class="flex-1"
                  :ui="{
                    base: 'table-fixed border-separate border-spacing-0',
                    thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                    th: 'first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                    td: 'border-b border-default'
                  }"
                >
                  <template #accountName-cell="{ row }">
                    <div class="flex items-center gap-3">
                      <div class="p-2 bg-primary/10 rounded-lg">
                        <UIcon name="i-lucide-wallet" class="w-4 h-4 text-primary" />
                      </div>
                      <span class="font-medium text-highlighted">{{ row.original.accountName }}</span>
                    </div>
                  </template>
                  <template #actions-cell="{ row }">
                    <div class="flex justify-end">
                      <UButton icon="i-lucide-trash" variant="ghost" color="error" size="xs" @click="deleteAccountDoc(row.original.id)" />
                    </div>
                  </template>
                </UTable>

                <UTable 
                  v-else 
                  :data="filteredTransactions" 
                  :columns="transactionColumns" 
                  class="flex-1"
                  :ui="{
                    base: 'table-fixed border-separate border-spacing-0',
                    thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                    th: 'first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                    td: 'border-b border-default'
                  }"
                >
                  <template #amount-cell="{ row }">
                    <span :class="`font-bold ${row.original.type === 'expense' ? 'text-error' : 'text-success'}`">
                      {{ row.original.type === 'expense' ? '-' : '+' }}{{ row.original.amount }}€
                    </span>
                  </template>
                  <template #type-cell="{ row }">
                    <UBadge :color="row.original.type === 'expense' ? 'error' : 'success'" variant="subtle" size="sm">
                      {{ row.original.type === 'expense' ? 'Dépense' : 'Revenu' }}
                    </UBadge>
                  </template>
                  <template #account-cell="{ row }">
                    <span class="text-sm">{{ row.original.account.label }}</span>
                  </template>
                  <template #frequency-cell="{ row }">
                    <span class="text-sm text-muted">
                      {{ frequencyOptions.find(f => f.value === row.original.frequency)?.label || row.original.frequency }}
                    </span>
                  </template>
                  <template #actions-cell="{ row }">
                    <div class="flex justify-end">
                      <UButton icon="i-lucide-trash" variant="ghost" color="error" size="xs" @click="deleteTransactionDoc(row.original.id)" />
                    </div>
                  </template>
                </UTable>

                <div v-if="(currentStep === 1 && accounts.length === 0) || (currentStep !== 1 && filteredTransactions.length === 0)" 
                     class="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted gap-4">
                  <div class="p-4 bg-default/5 rounded-full">
                    <UIcon :name="currentStep === 1 ? 'i-lucide-wallet' : 'i-lucide-list-plus'" class="w-12 h-12 opacity-20" />
                  </div>
                  <p>{{ currentStep === 1 ? $t('OnboardingPage.emptyAccounts') : (currentStep === 2 ? $t('OnboardingPage.emptyExpenses') : $t('OnboardingPage.emptyIncomes')) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCreateFireDoc } from '@/composables/firebase/useCreateFireDoc'
import { useReadFireDoc } from '@/composables/firebase/useReadFireDoc'
import { useDeleteFireDoc } from '@/composables/firebase/useDeleteFireDoc'
import { useCreateIterations } from '@/composables/firebase/dedicated/useCreateIterations'
import RouteName from '@/router/RouteName'
import type { DocumentData } from 'firebase/firestore'
import TransactionForm from '@/components/shared/TransactionForm.vue'
import { getLocalTimeZone } from '@internationalized/date'
import { calendarDateToTimestamp } from '@/helpers/dateHelpers'

const router = useRouter()
const route = useRoute()

// Initialisation du step depuis l'URL (?step=X)
const initialStep = parseInt(route.query.step as string) || 1
const currentStep = ref(initialStep >= 1 && initialStep <= 3 ? initialStep : 1)

// Synchronisation du step avec l'URL
watch(currentStep, (newStep) => {
  router.replace({
    query: { ...route.query, step: newStep.toString() }
  })
}, { immediate: true })

const transactionFormRef = ref<InstanceType<typeof TransactionForm> | null>(null)

// Firebase composables
const { doRequest: createDoc } = useCreateFireDoc()
const { doRequest: readDocs } = useReadFireDoc()
const { doRequest: deleteDoc } = useDeleteFireDoc()
const { doRequest: createIterations } = useCreateIterations()

// Data states
const accounts = ref<DocumentData[]>([])
const recurringTransactions = ref<DocumentData[]>([])
const isCreatingAccount = ref(false)
const isCreatingTransaction = ref(false)

const accountColumns = [
  { accessorKey: 'accountName', header: 'Nom du compte' },
  { id: 'actions', class: 'text-right' }
]

const transactionColumns = [
  { accessorKey: 'name', header: 'Libellé' },
  { accessorKey: 'amount', header: 'Montant' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'account', header: 'Compte' },
  { accessorKey: 'frequency', header: 'Fréquence' },
  { id: 'actions', class: 'text-right' }
]

// Step 1: Account Form
const accountForm = reactive({
  accountName: ''
})

const addAccount = async () => {
  if (!accountForm.accountName.trim()) return
  isCreatingAccount.value = true
  try {
    await createDoc({
      collectionName: 'accounts',
      data: { accountName: accountForm.accountName }
    })
    accountForm.accountName = ''
    await refreshAccounts()
  } finally {
    isCreatingAccount.value = false
  }
}

const deleteAccountDoc = async (id: string) => {
  await deleteDoc({ collectionName: 'accounts', documentId: id })
  await refreshAccounts()
}

const refreshAccounts = async () => {
  const result = await readDocs({ collectionName: 'accounts' })
  if (result && Array.isArray(result)) {
    accounts.value = result
  }
}

// Step 2 & 3: Transaction Form
const accountOptions = computed(() => accounts.value.map(acc => ({ label: acc.accountName, value: acc.id })))
const frequencyOptions = [
  { label: 'Une fois', value: 'once' },
  { label: 'Mensuel', value: 'monthly' },
  { label: 'Trimestriel', value: 'quarterly' },
  { label: 'Annuel', value: 'yearly' }
]

const addTransaction = async (formData: any) => {
  isCreatingTransaction.value = true
  try {
    const selectedAccount = accounts.value.find(acc => acc.id === formData.account)
    const type = currentStep.value === 2 ? 'expense' : 'income'
    
    const startDate = formData.startDate.toDate(getLocalTimeZone())
    const endDate = formData.endDate.toDate(getLocalTimeZone())

    const transactionData = {
      name: formData.name,
      amount: Number(formData.amount),
      type,
      account: {
        value: selectedAccount?.id,
        label: selectedAccount?.accountName
      },
      frequency: formData.frequency,
      effectDate: calendarDateToTimestamp(formData.startDate),
      effectEndDate: calendarDateToTimestamp(formData.endDate)
    }

    const transactionId = await createDoc({
      collectionName: 'recurringTransactions',
      data: transactionData
    })

    await createIterations({
      transactionId,
      startDate,
      endDate,
      amount: Number(formData.amount),
      name: formData.name,
      type,
      frequency: formData.frequency
    })

    transactionFormRef.value?.reset()
    await refreshTransactions()
  } finally {
    isCreatingTransaction.value = false
  }
}

const deleteTransactionDoc = async (id: string) => {
  await deleteDoc({ collectionName: 'recurringTransactions', documentId: id })
  await refreshTransactions()
}

const refreshTransactions = async () => {
  const result = await readDocs({ collectionName: 'recurringTransactions' })
  if (result && Array.isArray(result)) {
    recurringTransactions.value = result
  }
}

const filteredTransactions = computed(() => {
  const type = currentStep.value === 2 ? 'expense' : 'income'
  return recurringTransactions.value.filter(t => t.type === type)
})

const handleNext = () => {
  if (currentStep.value < 3) {
    currentStep.value++
  } else {
    router.push({ name: RouteName.HOME })
  }
}

onMounted(async () => {
  await refreshAccounts()
  await refreshTransactions()
})
</script>
