<template>
  <div class="flex-1 flex flex-col min-h-0 mt-5">
     <UInput v-model="searchQuery" :placeholder="$t('HomeSynthesisTable.searchPlaceholder')" icon="i-lucide-search" class="mb-4"
      :ui="{ base: 'w-full' }" />
    <UTable :data="filteredTransactions" :columns="columns" :grouping="['transactionId']" :grouping-options="grouping_options"
      class="flex-1 overflow-auto" :ui="UITableConfig">
      <template #title-cell="{ row }">
        <div v-if="row.getIsGrouped()" class="flex items-center">
          <span class="inline-block" :style="{ width: `calc(${row.depth} * 1rem)` }" />
          <UButton variant="ghost" color="neutral" class="mr-2" size="xs"
            :icon="row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
            @click="row.toggleExpanded()" />
          <span class="font-bold text-highlighted">{{ row.original.name }}</span>
          <UBadge variant="subtle" color="neutral" class="ml-2 font-normal">
            {{ row.getLeafRows().length }} itération{{ row.getLeafRows().length > 1 ? 's' : '' }}
          </UBadge>
        </div>
        <div v-else class="flex items-center group">
          <span class="inline-block" :style="{ width: `calc((${row.depth} + 1) * 1.5rem)` }" />
          <span class="text-dimmed italic mr-2">{{ $t('HomeSynthesisTable.iterationOf', { date: formatLongDate(row.original.date) }) }}</span>
        </div>
      </template>

      <template #amount-cell="{ row }">
        <div :class="['text-right font-medium', row.getIsGrouped() ? 'text-highlighted font-bold' : '']">
          {{ formatMoney(getGroupTotalAmount(row)) }}
        </div>
      </template>

      <template #account-cell="{ row }">
        <div v-if="row.getIsGrouped() && row.getIsExpanded()" class="text-dimmed">
          {{ row.original.account }}
        </div>
      </template>

      <template #type-cell="{ row }">
        <UBadge v-if="row.getIsGrouped() && row.getIsExpanded()"
          :color="row.original.type === 'income' ? 'success' : 'error'" variant="subtle" class="capitalize">
          {{ row.original.type === 'income' ? 'Revenu' : 'Dépense' }}
        </UBadge>
      </template>

      <template #actions-cell="{ row }">
        <div v-if="!row.getIsGrouped()" class="text-right">
          <UDropdownMenu :items="getIterationActions(row.original)" :content="{ align: 'end' }">
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
}

const data = computed<TransactionIteration[]>(() => {
  const flattened: TransactionIteration[] = []

  props.transactions.forEach((transaction) => {
    const filteredIterations = (transaction.iterations || []).filter((iteration: any) => {
      if (!props.range) return true
      const date = toDate(iteration.date)
      return isWithinInterval(date, { start: props.range.start, end: props.range.end })
    })

    filteredIterations.forEach((iteration: any) => {
      const date = iteration.date instanceof Timestamp ? iteration.date.toDate() : new Date(iteration.date)
      flattened.push({
        id: iteration.id,
        transactionId: transaction.id,
        name: iteration.name || transaction.name || '',
        date: date,
        amount: Number(iteration.amount !== undefined ? iteration.amount : (transaction.amount || 0)),
        type: iteration.type || transaction.type || '',
        account: transaction.account?.label || ''
      })
    })
  })

  return flattened
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

const getGroupTotalAmount = (row: any) => {
  return row.getLeafRows().reduce((acc: number, r: any) => acc + (r.original.amount || 0), 0)
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
  if (!searchQuery.value.trim()) {
    return data.value
  }

  const query = searchQuery.value.toLowerCase().trim()

  return data.value.filter((iteration) => {
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
