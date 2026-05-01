<template>
  <UDashboardPanel id="accounts">
    <template #header>
      <UDashboardNavbar title="Gestion des comptes" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton label="Nouveau compte" icon="i-lucide-plus" color="primary" @click="handleAddAccount" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6 overflow-auto h-full min-h-0">
        <!-- Main Content -->
        <div class="bg-elevated/50 border border-default rounded-xl overflow-hidden flex flex-col">
          <UTable :data="accounts" :columns="columns" class="flex-1 overflow-auto">
            <template #name-cell="{ row }">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-primary/10 rounded-lg">
                  <UIcon name="i-lucide-wallet" class="w-4 h-4 text-primary" />
                </div>
                <span class="font-medium text-highlighted">{{ row.original.accountName }}</span>
              </div>
            </template>

            <template #spending-cell="{ row }">
              <div class="flex flex-col gap-1">
                <div class="flex justify-between items-end">
                  <span class="font-bold text-highlighted">{{ formatMoney(getSpendingForAccount(row.original.accountName)) }}</span>
                  <span class="text-[10px] text-muted">{{ getSpendingPercentage(row.original.accountName) }}%</span>
                </div>
                <div class="w-24 h-1.5 bg-default/30 rounded-full overflow-hidden">
                  <div class="bg-error h-full rounded-full" :style="{ width: getSpendingPercentage(row.original.accountName) + '%' }"></div>
                </div>
              </div>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex justify-end gap-1">
                <UButton icon="i-lucide-pencil" variant="ghost" color="neutral" size="xs"
                  @click="handleEditAccount(row.original)" />
                <UButton icon="i-lucide-trash" variant="ghost" color="error" size="xs"
                  @click="handleDeleteAccount(row.original.id)" />
              </div>
            </template>
          </UTable>

          <div v-if="accounts.length === 0" class="p-12 text-center text-muted">
            Aucun compte trouvé.
          </div>
        </div>
      </div>

      <AccountEditModal ref="editModal" :account="selectedAccount" @saved="refreshAccounts" />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useReadFireDoc } from '@/composables/firebase/useReadFireDoc'
import { useDeleteFireDoc } from '@/composables/firebase/useDeleteFireDoc'
import { useSynthesisStore } from '@/stores/synthesisStore'
import { formatMoney } from '@/helpers/moneyHelpers'
import { toDate } from '@/helpers/dateHelpers'
import type { DocumentData } from 'firebase/firestore'
import { startOfMonth, endOfMonth, format, isWithinInterval } from 'date-fns'
import { fr } from 'date-fns/locale'
import AccountEditModal from '@/components/accounts/AccountEditModal.vue'

const { doRequest: getAccounts, isLoading } = useReadFireDoc()
const { doRequest: deleteAccount } = useDeleteFireDoc()
const synthesisStore = useSynthesisStore()

const accounts = ref<DocumentData[]>([])
const selectedAccount = ref<DocumentData | null>(null)
const editModal = ref<InstanceType<typeof AccountEditModal> | null>(null)

const statCardUI = {
  container: 'gap-y-1.5',
  wrapper: 'items-start',
  leading: 'hidden sm:block p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25',
  title: 'font-normal text-muted text-xs uppercase'
}

const columns = [
  { id: 'name', header: 'Compte' },
  { id: 'spending', header: 'Dépenses du mois' },
  { id: 'actions', header: '', class: 'text-right' }
]

const currentMonthRange = {
  start: startOfMonth(new Date()),
  end: endOfMonth(new Date())
}

const currentMonthName = computed(() => {
  return format(new Date(), 'MMMM yyyy', { locale: fr })
})

const refreshAccounts = async () => {
  const result = await getAccounts({ collectionName: 'accounts' })
  if (result && Array.isArray(result)) {
    accounts.value = result
  }
}

const getSpendingForAccount = (accountName: string) => {
  let total = 0
  synthesisStore.recurringTransactions.forEach(transaction => {
    // Vérification flexible du nom du compte
    const transactionAccount = transaction.account?.label || transaction.account
    if (transactionAccount !== accountName) return
    
    const iterations = transaction.iterations || []
    iterations.forEach((iteration: any) => {
      const date = toDate(iteration.date)
      if (isWithinInterval(date, currentMonthRange) && iteration.type === 'expense' && iteration.active !== false) {
        total += Number(iteration.amount || 0)
      }
    })
  })
  return total
}

const totalSpending = computed(() => {
  return accounts.value.reduce((acc, account) => acc + getSpendingForAccount(account.accountName), 0)
})

const getSpendingPercentage = (accountName: string) => {
  if (totalSpending.value === 0) return 0
  const spending = getSpendingForAccount(accountName)
  return Math.round((spending / totalSpending.value) * 100)
}

const handleAddAccount = () => {
  selectedAccount.value = null
  editModal.value?.openModal()
}

const handleEditAccount = (account: DocumentData) => {
  selectedAccount.value = account
  editModal.value?.openModal()
}

const handleDeleteAccount = async (id: string) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) {
    await deleteAccount({
      collectionName: 'accounts',
      documentId: id
    })
    await refreshAccounts()
  }
}

onMounted(async () => {
  await refreshAccounts()
  await synthesisStore.init()
})
</script>
