import { useRequest } from '@/composables/utils/useRequest'
import { getDb } from '@/config/firebase'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@nuxt/ui/composables'
import { addDoc, collection, Timestamp } from 'firebase/firestore'
import { addMonths, addYears, isBefore } from 'date-fns'

export interface CreateIterationParams {
  transactionId: string
  amount: number
  startDate: Date
  endDate?: Date
  name: string
  type: 'income' | 'expense'
  frequency: 'once' | 'monthly' | 'quarterly' | 'yearly'
}

type Frequency = 'once' | 'monthly' | 'quarterly' | 'yearly'

const getNextDate = (date: Date, frequency: Frequency): Date => {
  switch (frequency) {
    case 'monthly':
      return addMonths(date, 1)
    case 'quarterly':
      return addMonths(date, 3)
    case 'yearly':
      return addYears(date, 1)
    default:
      return date
  }
}

export function useCreateIterations() {
  const { add: addToast } = useToast()
  const authStore = useAuthStore()

  const runServices = async ({
    transactionId,
    amount,
    startDate,
    endDate,
    name,
    type,
    frequency,
  }: CreateIterationParams): Promise<void> => {
    try {
      if (!authStore.userId) {
        throw new Error('Vous devez être connecté')
      }

      const db = getDb()
      const iterationsRef = collection(db, 'recurringTransactions', transactionId, 'iterations')

      if (frequency === 'once') {
        await addDoc(iterationsRef, {
          date: Timestamp.fromDate(startDate),
          amount,
          name,
          type,
        })
      } else {
        if (!endDate) {
          throw new Error('La date de fin est requise pour les transactions récurrentes')
        }

        let currentDate = new Date(startDate)
        currentDate.setHours(0, 0, 0, 0)

        const endLimit = new Date(endDate)
        endLimit.setHours(0, 0, 0, 0)

        while (!isBefore(endLimit, currentDate)) {
          await addDoc(iterationsRef, {
            date: Timestamp.fromDate(currentDate),
            amount,
            name,
            type,
          })

          currentDate = getNextDate(currentDate, frequency)
          currentDate.setHours(0, 0, 0, 0)
        }
      }

      addToast({ title: 'Itérations créées', color: 'success' })
    } catch (error: unknown) {
      if (error instanceof Error) {
        addToast({ title: error.message, color: 'error' })
      }
      throw error
    }
  }

  return useRequest<void>({ runServices })
}
