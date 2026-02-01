<template>
  <UPageGrid
    class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px w-full flex"
  >
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
      <div
        class="flex items-center gap-2"
      >
        <span
          class="text-2xl font-semibold text-highlighted"
        >
          {{ formatMoney(stat.value) }}
        </span>
      </div>
    </UPageCard>
  </UPageGrid>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DocumentData } from 'firebase/firestore'
import { isWithinInterval } from 'date-fns'
import type { DateRange } from '../../types'
import { toDate } from '@/helpers/dateHelpers'
import { formatMoney, safeAdd, safeSubtract } from '@/helpers/moneyHelpers'

const props = defineProps<{
  transactions: DocumentData[]
  range?: DateRange
}>()

const filteredIterations = computed(() => {
  const all: any[] = []
  
  props.transactions.forEach(t => {
    // On vérifie si la transaction possède des itérations CHARGÉES (cas du Dashboard)
    const iterations = t.iterations || []
    
    if (iterations.length > 0) {
      // Cas avec itérations détaillées
      iterations.forEach((it: any) => {
        const date = toDate(it.date)
        if (!props.range || isWithinInterval(date, { start: props.range.start, end: props.range.end })) {
          all.push({
            ...it,
            type: t.type,
            amount: Number(it.amount !== undefined ? it.amount : (t.amount || 0))
          })
        }
      })
    } else {
      // Cas sans itérations CHARGÉES (ex: Page "Mon Mois")
      // On vérifie si la transaction elle-même est dans la plage de dates
      const startDate = toDate(t.effectDate)
      const endDate = t.effectEndDate ? toDate(t.effectEndDate) : null
      
      let shouldInclude = true
      if (props.range) {
        // La transaction est incluse si son intervalle [startDate, endDate]
        // intersecte l'intervalle sélectionné [props.range.start, props.range.end]
        const rangeStart = props.range.start
        const rangeEnd = props.range.end
        
        const isAfterRange = startDate > rangeEnd
        const isBeforeRange = endDate ? endDate < rangeStart : false
        
        shouldInclude = !isAfterRange && !isBeforeRange
      }

      if (shouldInclude) {
        all.push({
          type: t.type,
          amount: Number(t.amount || 0)
        })
      }
    }
  })
  
  return all
})

const expensesAmount = computed(() => {
  const amounts = filteredIterations.value
    ?.filter((it) => it.type === 'expense')
    .map((it) => it.amount)
    .filter((amount: any) => amount !== null && amount !== undefined && amount !== '' && !isNaN(Number(amount))) || []

  return safeAdd(amounts)
})

const incomesAmount = computed(() => {
  const amounts = filteredIterations.value
    ?.filter((it) => it.type === 'income')
    .map((it) => it.amount)
    .filter((amount: any) => amount !== null && amount !== undefined && amount !== '' && !isNaN(Number(amount))) || []

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
