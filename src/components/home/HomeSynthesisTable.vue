<template>
  <div class="flex-1 flex flex-col min-h-0 mt-5">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
      <UInput v-model="searchQuery" :placeholder="$t('HomeSynthesisTable.searchPlaceholder')" icon="i-lucide-search"
        :ui="{ base: 'w-full' }" />
      
      <USelectMenu v-model="filterType" :items="typeOptions" placeholder="Filtrer par types" icon="i-lucide-filter" multiple by="value" />
      
      <USelectMenu v-model="filterAccount" :items="accountOptions" placeholder="Filtrer par comptes" icon="i-lucide-wallet" multiple by="value" />
      
      <USelectMenu v-model="filterAmount" :items="amountOptions" placeholder="Filtrer par montants" icon="i-lucide-banknote" multiple by="value" />
    </div>
    <UTable :data="filteredTransactions" :columns="columns" :grouping="['transactionId']" :grouping-options="grouping_options"
      class="flex-1 overflow-auto" :ui="UITableConfig">
      <template #title-cell="{ row }">
        <div v-if="row.getIsGrouped()" class="flex items-center" :class="{ 'opacity-50 grayscale italic': !isGroupActive(row) }">
          <span class="inline-block" :style="{ width: `calc(${row.depth} * 1rem)` }" />
          
          <UButton v-if="row.getLeafRows().length > 1" variant="ghost" color="neutral" class="mr-2" size="xs"
            :icon="row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
            @click="row.toggleExpanded()" />
          <span v-else class="w-6 mr-2" /> <!-- Espacement pour aligner si pas de chevron -->

          <span class="font-bold text-highlighted">{{ row.original.name }}</span>
          
          <UBadge v-if="row.getLeafRows().length > 1" variant="subtle" color="neutral" class="ml-2 font-normal">
            {{ row.getLeafRows().length }} itérations
          </UBadge>
          <span v-else class="text-dimmed italic ml-2 text-sm">
            ({{ formatLongDate(row.getLeafRows()[0].original.date) }})
          </span>
        </div>
        <div v-else-if="(row.getParentRow()?.getLeafRows()?.length ?? 0) > 1" class="flex items-center group" :class="{ 'opacity-40 grayscale italic': !row.original.active }">
          <span class="inline-block" :style="{ width: `calc((${row.depth} + 1) * 1.5rem)` }" />
          <span class="text-dimmed italic mr-2">{{ $t('HomeSynthesisTable.iterationOf', { date: formatLongDate(row.original.date) }) }}</span>
        </div>
      </template>

      <template #amount-cell="{ row }">
        <div :class="['text-right font-medium', row.getIsGrouped() ? 'text-highlighted font-bold' : '', (!row.getIsGrouped() && !row.original.active) || (row.getIsGrouped() && !isGroupActive(row)) ? 'opacity-40 grayscale italic' : '']">
          {{ row.getIsGrouped() ? formatMoney(getGroupTotalAmount(row)) : formatMoney(Number(row.getValue('amount'))) }}
        </div>
      </template>

      <template #account-cell="{ row }">
        <div v-if="row.getIsGrouped() && (row.getIsExpanded() || row.getLeafRows().length === 1)" class="text-dimmed" :class="{ 'opacity-40': !isGroupActive(row) }">
          {{ row.original.account }}
        </div>
      </template>

      <template #type-cell="{ row }">
        <UBadge v-if="row.getIsGrouped() && (row.getIsExpanded() || row.getLeafRows().length === 1)"
          :color="row.original.type === 'income' ? 'success' : 'error'" variant="subtle" class="capitalize" :class="{ 'opacity-40': !isGroupActive(row) }">
          {{ row.original.type === 'income' ? 'Revenu' : 'Dépense' }}
        </UBadge>
      </template>

      <template #actions-cell="{ row }">
        <div v-if="!row.getIsGrouped() || (row.getIsGrouped() && row.getLeafRows().length === 1)" class="text-right" :class="{ 'opacity-40': (row.getIsGrouped() ? !isGroupActive(row) : !row.original.active) }">
          <UDropdownMenu :items="getIterationActions(row.getIsGrouped() ? row.getLeafRows()[0].original : row.original)" :content="{ align: 'end' }">
            <UButton icon="i-lucide-ellipsis-vertical" size="xs" color="neutral" variant="ghost" />
          </UDropdownMenu>
        </div>
      </template>
    </UTable>
  </div>
  <IterationEditModal v-model="isEditModalOpen" :iteration="selectedIteration" />
</template>

<script setup lang="ts">
import { computed, ref, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { getGroupedRowModel } from '@tanstack/vue-table'
import type { GroupingOptions } from '@tanstack/vue-table'
import { Timestamp, type DocumentData } from 'firebase/firestore'
import type { Period, DateRange } from '../../types'
import { isWithinInterval } from 'date-fns'
import { toDate, formatLongDate } from '@/helpers/dateHelpers'
import { formatMoney } from '@/helpers/moneyHelpers'
import { UITableConfig } from '@/config/ui-theme'
import IterationEditModal from './IterationEditModal.vue'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const searchQuery = ref('')
const filterType = ref([])
const filterAccount = ref([])
const filterAmount = ref([])

const typeOptions = [
  { label: 'Revenu', value: 'income' },
  { label: 'Dépense', value: 'expense' }
]

const accountOptions = computed(() => {
  const accounts = new Set<string>()
  props.transactions.forEach(t => {
    if (t.account?.label) accounts.add(t.account.label)
  })
  
  return Array.from(accounts).map(acc => ({ label: acc, value: acc }))
})

const amountOptions = [
  { label: 'Petit (< 50€)', value: 'small' },
  { label: 'Moyen (50€ - 500€)', value: 'medium' },
  { label: 'Gros (> 500€)', value: 'large' }
]

const props = defineProps<{
  period?: Period
  range?: DateRange
  transactions: DocumentData[]
  isLoading?: boolean
}>()

type TransactionIteration = {
  id?: string
  transactionId: string
  name: string
  date: Date
  amount: number
  type: string
  account: string
  active: boolean
}

const data = computed<TransactionIteration[]>(() => {
  const flattened: TransactionIteration[] = []

  props.transactions.forEach((transaction) => {
    const iterations = transaction.iterations || []
    
    // On prend toutes les itérations dans la plage, qu'elles soient actives ou non
    const rangeIterations = iterations.filter((iteration: any) => {
      if (!props.range) return true
      const date = toDate(iteration.date)
      return isWithinInterval(date, { start: props.range.start, end: props.range.end })
    })

    rangeIterations.forEach((iteration: any) => {
      const date = iteration.date instanceof Timestamp ? iteration.date.toDate() : new Date(iteration.date)
      flattened.push({
        id: iteration.id,
        transactionId: transaction.id,
        name: iteration.name || transaction.name || '',
        date: date,
        amount: Number(iteration.amount !== undefined ? iteration.amount : (transaction.amount || 0)),
        type: iteration.type || transaction.type || '',
        account: transaction.account?.label || '',
        active: iteration.active !== false
      })
    })
  })

  // Tri : Actifs d'abord, puis par date
  return flattened.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1
    return a.date.getTime() - b.date.getTime()
  })
})

const columns: TableColumn<TransactionIteration>[] = [
  {
    id: 'title',
    header: 'Transaction / Itérations',
    meta: { class: { td: 'w-full' } }
  },
  {
    accessorKey: 'transactionId',
    header: 'ID',
  },
  {
    accessorKey: 'account',
    header: 'Compte'
  },
  {
    accessorKey: 'type',
    header: 'Type'
  },
  {
    id: 'actions'
  },
  {
    accessorKey: 'amount',
    header: 'Montant',
    aggregationFn: 'sum'
  }
]

const grouping_options = ref<GroupingOptions>({
  groupedColumnMode: 'remove',
  getGroupedRowModel: getGroupedRowModel()
})

const isEditModalOpen = ref(false)
const selectedIteration = ref<TransactionIteration | null>(null)

const openEditModal = (iteration: TransactionIteration) => {
  selectedIteration.value = iteration
  isEditModalOpen.value = true
}

const isGroupActive = (row: any) => {
  return row.getLeafRows().some((r: any) => r.original.active)
}

const getGroupTotalAmount = (row: any) => {
  return row.getLeafRows().reduce((acc: number, r: any) => {
    // On ne compte que les itérations actives pour le total ? 
    // Attendez, la consigne dit "exclu du compte du mois".
    // Donc oui, le total du groupe doit aussi refléter l'exclusion.
    if (r.original.active) {
      return acc + (r.original.amount || 0)
    }
    return acc
  }, 0)
}

const getIterationActions = (iteration: TransactionIteration) => [
  [{
    label: 'Actions',
    type: 'label'
  }],
  [{
    label: 'Éditer',
    icon: 'i-lucide-pencil',
    onSelect: () => openEditModal(iteration)
  }]
]

const filteredTransactions = computed(() => {
  let filtered = data.value

  // Filtre par type (multi-select)
  if (filterType.value.length > 0) {
    const selectedValues = filterType.value.map((opt: any) => opt.value)
    filtered = filtered.filter(it => selectedValues.includes(it.type))
  }

  // Filtre par compte (multi-select)
  if (filterAccount.value.length > 0) {
    const selectedValues = filterAccount.value.map((opt: any) => opt.value)
    filtered = filtered.filter(it => selectedValues.includes(it.account))
  }

  // Filtre par montant (multi-select)
  if (filterAmount.value.length > 0) {
    const selectedValues = filterAmount.value.map((opt: any) => opt.value)
    filtered = filtered.filter(it => {
      return selectedValues.some(range => {
        if (range === 'small') return it.amount < 50
        if (range === 'medium') return it.amount >= 50 && it.amount <= 500
        if (range === 'large') return it.amount > 500
        return false
      })
    })
  }

  // Filtre par recherche textuelle
  if (!searchQuery.value.trim()) {
    return filtered
  }

  const query = searchQuery.value.toLowerCase().trim()

  return filtered.filter((iteration) => {
    const labelMatch = iteration.name.toLowerCase().includes(query)

    const typeLabel = iteration.type === 'expense' ? 'dépense' : iteration.type === 'income' ? 'revenu' : iteration.type
    const typeMatch = typeLabel.toLowerCase().includes(query)
    const accountMatch = iteration.account.toLowerCase().includes(query)

    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(iteration.amount)
    const amountMatch = formattedAmount.toLowerCase().includes(query) || iteration.amount.toString().includes(query)

    const formattedDate = formatLongDate(iteration.date)
    const dateMatch = formattedDate.toLowerCase().includes(query)

    return labelMatch || typeMatch || accountMatch || amountMatch || dateMatch
  })
})
</script>
