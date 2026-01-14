<template>
  <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px w-full flex">
    <UPageCard
      v-for="(stat, index) in stats"
      :key="index"
      :icon="stat.icon"
      :title="stat.title"
      to="/customers"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25',
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1 w-full"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ formatMoney(stat.value) }}
        </span>
      </div>
    </UPageCard>
  </UPageGrid>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DocumentData } from 'firebase/firestore';
import { formatMoney, safeAdd, safeSubtract } from '@/helpers/moneyHelpers'

const props = defineProps<{
  transactions: DocumentData[]
}>()

const expensesAmount = computed(() => {
  const amounts = props.transactions
    ?.filter((transaction: DocumentData) => transaction.type === 'expense')
    .map((transaction: DocumentData) => transaction.amount) || []

  return safeAdd(amounts)
})

const incomesAmount = computed(() => {
  const amounts = props.transactions
    ?.filter((transaction: DocumentData) => transaction.type === 'income')
    .map((transaction: DocumentData) => transaction.amount) || []

  return safeAdd(amounts)
})

const balanceAmount = computed(() => {
  return safeSubtract(incomesAmount.value, expensesAmount.value)
})

const stats = computed(() => [
  {
    title: 'Dépenses',
    icon: 'i-lucide-arrow-down-left',
    value: expensesAmount.value
  },
  {
    title: 'Revenus',
    icon: 'i-lucide-arrow-up-right',
    value: incomesAmount.value
  },
  {
    title: 'Solde',
    icon: 'i-lucide-arrow-up-right',
    value: balanceAmount.value
  }
])

</script>
