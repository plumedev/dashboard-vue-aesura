import { useRequest } from '@/composables/utils/useRequest'
import { getDb } from '@/config/firebase'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@nuxt/ui/composables'
import { addDoc, collection, Timestamp } from 'firebase/firestore'

export interface CreateIterationsParams {
  transactionId: string
  startDate?: Date
  endDate?: Date
}

export interface CreateIterationParams {
  transactionId: string
  date: Date
  amount: number
}

export function useCreateIterations() {
  const { add: addToast } = useToast()
  const authStore = useAuthStore()

  const runServices = async ({
    transactionId,
    date,
    amount,
  }: CreateIterationParams): Promise<string> => {
    try {
      if (!authStore.userId) {
        throw new Error('Vous devez être connecté')
      }

      const db = getDb()
      const iterationsRef = collection(db, 'recurringTransactions', transactionId, 'iterations')

      const docRef = await addDoc(iterationsRef, {
        date: Timestamp.fromDate(date),
        amount,
      })

      addToast({ title: 'Itération créée', color: 'success' })
      return docRef.id
    } catch (error: unknown) {
      if (error instanceof Error) {
        addToast({ title: error.message, color: 'error' })
      }
      throw error
    }
  }

  return useRequest<string>({ runServices })
}
