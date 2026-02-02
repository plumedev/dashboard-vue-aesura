import { doc, updateDoc, Timestamp } from 'firebase/firestore'
import { getDb } from '@/config/firebase'
import { useRequest } from '@/composables/utils/useRequest'
import { useToast } from '@nuxt/ui/composables'
import { useAuthStore } from '@/stores/authStore'

export interface UpdateIterationParams {
  transactionId: string
  iterationId: string
  data: {
    amount?: number
    date?: Date
    name?: string
    type?: 'income' | 'expense'
  }
}

export function useUpdateIteration() {
  const { add: addToast } = useToast()
  const authStore = useAuthStore()

  const runServices = async ({
    transactionId,
    iterationId,
    data,
  }: UpdateIterationParams): Promise<void> => {
    try {
      if (!authStore.userId) {
        throw new Error('Vous devez être connecté')
      }

      const db = getDb()
      const iterationRef = doc(
        db,
        'recurringTransactions',
        transactionId,
        'iterations',
        iterationId
      )

      const updateData: any = { ...data }
      if (data.date) {
        updateData.date = Timestamp.fromDate(data.date)
      }

      await updateDoc(iterationRef, updateData)

      addToast({ title: 'Itération mise à jour', color: 'success' })
    } catch (error: unknown) {
      if (error instanceof Error) {
        addToast({ title: error.message, color: 'error' })
      }
      throw error
    }
  }

  return useRequest<void>({ runServices })
}
