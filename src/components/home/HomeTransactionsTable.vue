<template>
  <div class="flex-1 flex flex-col min-h-0 mt-5">
    <UInput v-model="searchQuery" placeholder="Rechercher une transaction..." icon="i-lucide-search" class="mb-4"
      :ui="{ base: 'w-full' }" />
    <UTable sticky loading-animation="carousel" :loading="isLoading" :data="filteredTransactions" :columns="columns"
      class="flex-1 overflow-auto" :ui="{
        base: 'table-fixed border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default'
      }" />
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { Frequency, type Period, type DateRange } from '../../types'
import { DocumentData, Timestamp } from 'firebase/firestore'
import { formatDate } from '@/helpers/dateHelpers'
import { useDeleteFireDoc } from '@/composables/firebase/useDeleteFireDoc'

const searchQuery = ref('')

const { doRequest: deleteTransaction } = useDeleteFireDoc()

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
const UDropdownMenu = resolveComponent('UDropdownMenu')

const convertTransactionsForTable = (transactions: DocumentData[]): TransactionForTable[] => {
  return transactions.map((transaction) => {
    return {
      label: transaction.name || '',
      id: transaction.id || '',
      date: transaction.effectDate,
      type: transaction.type || '',
      amount: transaction.amount || 0,
      account: transaction.account?.label || '',
      frequency: transaction.frequency || ''
    }
  })
}

const props = defineProps<{
  period?: Period
  range?: DateRange
  transactions: DocumentData[]
  isLoading?: boolean
}>()

const allTransactions = computed(() => convertTransactionsForTable(props.transactions))

const filteredTransactions = computed(() => {
  if (!searchQuery.value.trim()) {
    return allTransactions.value
  }

  const query = searchQuery.value.toLowerCase().trim()

  return allTransactions.value.filter((transaction) => {
    // Recherche dans le libellé
    const labelMatch = transaction.label.toLowerCase().includes(query)

    // Recherche dans le type (en français)
    const typeLabel = transaction.type === 'expense' ? 'dépense' : transaction.type === 'income' ? 'revenu' : transaction.type
    const typeMatch = typeLabel.toLowerCase().includes(query)

    // Recherche dans le compte
    const accountMatch = transaction.account.toLowerCase().includes(query)

    // Recherche dans le montant (formaté)
    const formattedAmount = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(transaction.amount)
    const amountMatch = formattedAmount.toLowerCase().includes(query) || transaction.amount.toString().includes(query)

    // Recherche dans la date formatée
    const formattedDate = formatDate(transaction.date)
    const dateMatch = formattedDate.toLowerCase().includes(query)

    return labelMatch || typeMatch || accountMatch || amountMatch || dateMatch
  })
})

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
    accessorKey: 'frequency',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Fréquence',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-a-z'
            : 'i-lucide-arrow-down-a-z'
          : 'i-lucide-arrow-down-up',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    },
    cell: ({ row }) => {
      const frequency = row.getValue('frequency') as string
      const frequencyLabels: Record<string, string> = {
        [Frequency.UNIQUE]: 'Unique',
        [Frequency.MONTHLY]: 'Mensuel',
        [Frequency.QUARTERLY]: 'Trimestriel',
        [Frequency.YEARLY]: 'Annuel'
      }
      return frequencyLabels[frequency] || frequency
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
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const transactionId = row.original.id
      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: {
              align: 'end'
            },
            items: getRowActions(transactionId)
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto'
            })
        )
      )
    }
  }
]

const emit = defineEmits<{
  (e: 'transactionDeleted'): void
  (e: 'editTransaction', transaction: DocumentData): void
}>()


function getRowActions(transactionId: string) {
  return [
    {
      type: 'label',
      label: 'Actions'
    },
    {
      label: 'Éditer',
      icon: 'i-lucide-pencil',
      onSelect() {
        const originalTransaction = props.transactions.find(t => t.id === transactionId)
        if (originalTransaction) {
          emit('editTransaction', originalTransaction)
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Supprimer',
      icon: 'i-lucide-trash',
      color: 'error',
      async onSelect() {
        await deleteTransaction({
          collectionName: 'recurringTransactions',
          documentId: transactionId
        })
        emit('transactionDeleted')
      }
    }
  ]
}
</script>
