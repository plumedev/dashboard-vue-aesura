<template>
  <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px w-full flex">
    <UPageCard v-for="(stat, index) in stats" :key="index" :icon="stat.icon" :title="stat.title" variant="subtle" :ui="{
      container: 'gap-y-1.5',
      wrapper: 'items-start',
      leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25',
      title: 'font-normal text-muted text-xs uppercase'
    }" class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1 w-full">
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ formatMoney(stat.value) }}
        </span>
      </div>
    </UPageCard>
  </UPageGrid>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DocumentData } from 'firebase/firestore'
import { isWithinInterval, areIntervalsOverlapping } from 'date-fns'
import type { IIteration } from '@/shared/interfaces/IIteration'
import type { IIterationWithContext } from '@/shared/interfaces/IIterationWithContext'
import type { DateRange } from '../../types'
import { toDate } from '@/helpers/dateHelpers'
import { formatMoney, safeAdd, safeSubtract } from '@/helpers/moneyHelpers'
import { useI18n } from 'vue-i18n'

const { t } = useI18n() 

const props = defineProps<{
  transactions: DocumentData[]
  range?: DateRange
}>()

const filteredIterations = computed(() => {
  const iterationsInSelectedDateRange: IIterationWithContext[] = []

  props.transactions.forEach(transaction => {
    const iterations: IIteration[] = transaction.iterations || []

    if (iterations.length > 0) {
      iterations.forEach((iteration: IIteration) => {
        const date = toDate(iteration.date)

        const isDateInSelectedRange = !props.range || isWithinInterval(date, { start: props.range.start, end: props.range.end })

        if (isDateInSelectedRange) {
          iterationsInSelectedDateRange.push({
            ...iteration,
            date: date,
            type: transaction.type,
            amount: Number(iteration.amount)
          })
        }
      })
    } else {

      const startDate = toDate(transaction.effectDate)
      const endDate = transaction.effectEndDate ? toDate(transaction.effectEndDate) : new Date(8640000000000000)

      let shouldInclude = true
      if (props.range) {
        shouldInclude = areIntervalsOverlapping(
          { start: startDate, end: endDate },
          { start: props.range.start, end: props.range.end }
        )
      }

      if (shouldInclude) {
        iterationsInSelectedDateRange.push({
          type: transaction.type,
          amount: Number(transaction.amount || 0)
        })
      }
    }
  })

  return iterationsInSelectedDateRange
})

const expensesAmount = computed(() => {
  const amounts = filteredIterations.value
    ?.filter((iteration) => iteration.type === 'expense')
    .map((iteration) => iteration.amount)

  return safeAdd(amounts)
})

const incomesAmount = computed(() => {
  const amounts = filteredIterations.value
    ?.filter((iteration) => iteration.type === 'income')
    .map((iteration) => iteration.amount)

  return safeAdd(amounts)
})

const balanceAmount = computed(() => {
  return safeSubtract(incomesAmount.value, expensesAmount.value)
})

const stats = computed(() => [
  {
    title: t('HomeStats.expenses'),
    icon: 'i-lucide-arrow-down-left',
    value: expensesAmount.value
  },
  {
    title: t('HomeStats.incomes'),
    icon: 'i-lucide-arrow-up-right',
    value: incomesAmount.value
  },
  {
    title: t('HomeStats.balance'),
    icon: 'i-lucide-arrow-up-right',
    value: balanceAmount.value
  }
])

</script>
