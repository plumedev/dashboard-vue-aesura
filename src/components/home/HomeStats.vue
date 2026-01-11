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
          {{ stat.value }}
        </span>
      </div>
    </UPageCard>
  </UPageGrid>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DocumentData } from 'firebase/firestore';


const props = defineProps<{
  transactions: DocumentData[]
}>()

const expensesAmount = computed(() => {
  return props.transactions?.reduce((acc: number, transaction: DocumentData) => {
    if (transaction.type === 'expense') {
      return acc + Number(transaction.amount)
    }
    return acc
  }, 0) ?? 0
})

const incomesAmount = computed(() => {
  return props.transactions?.reduce((acc: number, transaction: DocumentData) => {
    if (transaction.type === 'income') {
      return acc + Number(transaction.amount)
    }
    return acc
  }, 0) ?? 0
})

const balanceAmount = computed(() => {
  return incomesAmount.value - expensesAmount.value
})

const stats = computed(() => [
  {
    title: 'Expenses',
    icon: 'i-lucide-arrow-down-left',
    value: expensesAmount.value
  },
  {
    title: 'Incomes',
    icon: 'i-lucide-arrow-up-right',
    value: incomesAmount.value
  },
  {
    title: 'Balance',
    icon: 'i-lucide-arrow-up-right',
    value: balanceAmount.value
  }
])

</script>
