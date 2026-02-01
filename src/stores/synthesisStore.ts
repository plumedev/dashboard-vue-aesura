import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useGetRecurringTransactions } from '@/composables/firebase/dedicated/useGetRecurringTransactions'
import type { DocumentData, Timestamp } from 'firebase/firestore'
import type { Range } from '@/types'
import { Frequency } from '@/types'
import { addMonths, addQuarters, addYears, isWithinInterval, isBefore, isAfter } from 'date-fns'

export interface TransactionWithIterations extends DocumentData {
  iterations: Date[]
}

export const useSynthesisStore = defineStore('synthesis', () => {
  const recurringTransactions = ref<DocumentData[]>([])
  const transactionsWithIterations = ref<TransactionWithIterations[]>([])
  const isInitialized = ref(false)

  const { doRequest: fetchRecurringTransactions } = useGetRecurringTransactions()

  const getRecurringTransactions = async () => {
    try {
      const response = await fetchRecurringTransactions()
      recurringTransactions.value = response
      return response
    } catch (error) {
      console.error(error)
    }
  }

  const generateTransactionsIteration = (transactions: DocumentData[], range: Range) => {
    const result: TransactionWithIterations[] = []

    for (const transaction of transactions) {
      const effectDate = (transaction.effectDate as Timestamp).toDate()
      const effectEndDate = (transaction.effectEndDate as Timestamp).toDate()
      const frequency = transaction.frequency as string
      const iterations: Date[] = []

      // Déterminer l'intervalle effectif (intersection entre transaction et range sélectionné)
      const startDate = isAfter(effectDate, range.start) ? effectDate : range.start
      const endDate = isBefore(effectEndDate, range.end) ? effectEndDate : range.end

      // Si la transaction est hors de la plage sélectionnée, on ne l'ajoute pas
      if (isAfter(startDate, endDate)) {
        continue
      }

      let currentDate = new Date(effectDate)

      // Générer les itérations selon la fréquence
      while (!isAfter(currentDate, endDate)) {
        if (isWithinInterval(currentDate, { start: startDate, end: endDate })) {
          iterations.push(new Date(currentDate))
        }

        // Avancer à la prochaine itération selon la fréquence
        switch (frequency) {
          case Frequency.UNIQUE:
            // Une seule itération, on sort de la boucle
            currentDate = new Date(endDate.getTime() + 1)
            break
          case Frequency.MONTHLY:
            currentDate = addMonths(currentDate, 1)
            break
          case Frequency.QUARTERLY:
            currentDate = addQuarters(currentDate, 1)
            break
          case Frequency.YEARLY:
            currentDate = addYears(currentDate, 1)
            break
          default:
            currentDate = new Date(endDate.getTime() + 1)
        }
      }

      // N'ajouter que si la transaction a au moins une itération dans le range
      if (iterations.length > 0) {
        result.push({ ...transaction, iterations })
      }
    }

    transactionsWithIterations.value = result
    return result
  }

  const init = async () => {
    if (isInitialized.value) return
    await getRecurringTransactions()
    isInitialized.value = true
  }

  init()

  return {
    recurringTransactions,
    transactionsWithIterations,
    isInitialized,
    getRecurringTransactions,
    generateTransactionsIteration,
    init,
  }
})
