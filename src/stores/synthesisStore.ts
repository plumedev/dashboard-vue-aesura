import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useGetRecurringTransactions } from '@/composables/firebase/dedicated/useGetRecurringTransactions'
import { useGetIterations } from '@/composables/firebase/dedicated/useGetIterations'
import type { DocumentData } from 'firebase/firestore'

export const useSynthesisStore = defineStore('synthesis', () => {
  const recurringTransactions = ref<DocumentData[]>([])
  const isInitialized = ref(false)

  const { doRequest: fetchRecurringTransactions } = useGetRecurringTransactions()
  const { doRequest: fetchIterations } = useGetIterations()

  const getRecurringTransactions = async () => {
    try {
      const response = await fetchRecurringTransactions()

      // Pour chaque transaction, on va chercher ses itérations
      const transactionsWithRealIterations = await Promise.all(
        response.map(async t => {
          const iterations = await fetchIterations(t.id)
          return { ...t, iterations }
        })
      )

      recurringTransactions.value = transactionsWithRealIterations
      return transactionsWithRealIterations
    } catch (error) {
      console.error(error)
    }
  }

  const init = async () => {
    if (isInitialized.value) return
    await getRecurringTransactions()
    isInitialized.value = true
  }

  init()

  return {
    recurringTransactions,
    isInitialized,
    getRecurringTransactions,
    init,
  }
})
