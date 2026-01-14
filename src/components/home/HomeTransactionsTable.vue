<template>
  <div class="flex-1 flex flex-col min-h-0 mt-5">
    <UTable
      sticky
      loading-animation="carousel"
      :loading="isLoading"
      :data="convertTransactionsForTable(transactions)"
      :columns="columns"
      class="flex-1 overflow-auto"
      :ui="{
        base: 'table-fixed border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default'
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Period, Range } from '../../types'
import { DocumentData, Timestamp } from 'firebase/firestore'
import { formatDate } from '@/helpers/dateHelpers'

defineProps<{
  period: Period
  range: Range
  transactions: DocumentData[]
  isLoading: boolean
}>()

export interface TransactionForTable {
  label: string
  id: string
  date: Date | Timestamp | string
  type: string
  amount: number
  account: string
  frequency: string
}

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const convertTransactionsForTable = (transactions: DocumentData[]): TransactionForTable[] => {
  return transactions.map((transaction) => {
    return {
      label: transaction.name || '',
      id: transaction.id || '',
      date: transaction.effectDate,
      type: transaction.type || '',
      amount: transaction.amount || 0,
      account: transaction.account || '',
      frequency: transaction.frequency || ''
    }
  })
}

const columns: TableColumn<TransactionForTable>[] = [
  {
    accessorKey: 'label',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Libellé',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-a-z'
            : 'i-lucide-arrow-down-a-z'
          : 'i-lucide-arrow-down-up',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    }
  },
  {
    accessorKey: 'date',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Date',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-calendar-arrow-down'
            : 'i-lucide-calendar-arrow-up'
          : 'i-lucide-calendar',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    },
    cell: ({ row }) => {
      const date = row.getValue('date') as Date | Timestamp | string
      return formatDate(date)
    },
    sortingFn: (rowA, rowB) => {
      const dateA = rowA.original.date
      const dateB = rowB.original.date

      // Convertir en Date pour comparer
      const dateAObj = dateA instanceof Date ? dateA : dateA instanceof Timestamp ? dateA.toDate() : new Date(dateA)
      const dateBObj = dateB instanceof Date ? dateB : dateB instanceof Timestamp ? dateB.toDate() : new Date(dateB)

      return dateAObj.getTime() - dateBObj.getTime()
    }
  },
  {
    accessorKey: 'type',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Type',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    },
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      const color = {
        expense: 'error' as const,
        income: 'success' as const
      }[type] || 'neutral' as const

      const label = type === 'expense' ? 'Dépense' : type === 'income' ? 'Revenu' : type

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => label)
    },
    sortingFn: (rowA, rowB) => {
      const typeA = rowA.original.type
      const typeB = rowB.original.type
      // Trier: expense avant income
      if (typeA === typeB) return 0
      if (typeA === 'expense') return -1
      if (typeB === 'expense') return 1
      return typeA.localeCompare(typeB)
    }
  },
  {
    accessorKey: 'account',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Compte',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    }
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h('div', { class: 'text-right' }, [
        h(UButton, {
          color: 'neutral',
          variant: 'ghost',
          label: 'Montant',
          icon: isSorted
            ? isSorted === 'asc'
              ? 'i-lucide-arrow-down-0-1'
              : 'i-lucide-arrow-down-1-0'
            : 'i-lucide-arrow-up-down',
          class: '-mx-2.5 ml-auto',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
        })
      ])
    },
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue('amount') as string)

      const formatted = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount)

      return h('div', { class: 'text-right font-medium' }, formatted)
    }
  }
]
</script>


