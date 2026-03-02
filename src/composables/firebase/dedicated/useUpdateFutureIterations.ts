import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  Timestamp,
  orderBy,
  limit,
  doc,
} from 'firebase/firestore'
import { addMonths, addYears, isBefore } from 'date-fns'
import { getDb } from '@/config/firebase'
import { useRequest } from '@/composables/utils/useRequest'
import { useToast } from '@nuxt/ui/composables'
import { useAuthStore } from '@/stores/authStore'

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

export interface UpdateFutureIterationsParams {
  transactionId: string
  newStartDate: Date
  newEndDate: Date
  frequency: Frequency
  data: {
    amount?: number
    name?: string
    type?: 'income' | 'expense'
  }
}

export function useUpdateFutureIterations() {
  const { add: addToast } = useToast()
  const authStore = useAuthStore()

  const runServices = async ({
    transactionId,
    newStartDate,
    newEndDate,
    frequency,
    data,
  }: UpdateFutureIterationsParams): Promise<void> => {
    try {
      if (!authStore.userId) {
        throw new Error('Vous devez être connecté')
      }

      const db = getDb()
      const iterationsRef = collection(db, 'recurringTransactions', transactionId, 'iterations')

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const startLimit = new Date(newStartDate)
      startLimit.setHours(0, 0, 0, 0)

      const endLimit = new Date(newEndDate)
      endLimit.setHours(23, 59, 59, 999)

      const batch = writeBatch(db)

      const q = query(iterationsRef, where('date', '>=', Timestamp.fromDate(today)))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        querySnapshot.forEach(docSnap => {
          const iterationDate = docSnap.data().date.toDate()

          if (iterationDate < startLimit || iterationDate > endLimit) {
            batch.delete(docSnap.ref)
          } else {
            batch.update(docSnap.ref, data)
          }
        })
      }

      if (frequency !== 'once') {
        const lastIterQuery = query(iterationsRef, orderBy('date', 'desc'), limit(1))
        const lastIterSnap = await getDocs(lastIterQuery)

        let currentDate: Date

        if (!lastIterSnap.empty) {
          const lastDate = lastIterSnap.docs[0].data().date.toDate()
          currentDate = getNextDate(lastDate, frequency)
          currentDate.setHours(0, 0, 0, 0)
        } else {
          currentDate = new Date(startLimit)
        }

        while (!isBefore(endLimit, currentDate)) {
          const newDocRef = doc(iterationsRef)
          batch.set(newDocRef, {
            date: Timestamp.fromDate(currentDate),
            amount: data.amount ?? 0,
            name: data.name ?? '',
            type: data.type ?? 'expense',
          })

          currentDate = getNextDate(currentDate, frequency)
          currentDate.setHours(0, 0, 0, 0)
        }
      }

      await batch.commit()

      // addToast({ title: 'Itérations futures mises à jour', color: 'success' }) // we might not need an extra toast here if the main save provides it, but let's leave it or remove it. Better to remove it to avoid double toasts.
    } catch (error: unknown) {
      if (error instanceof Error) {
        addToast({ title: error.message, color: 'error' })
      }
      throw error
    }
  }

  return useRequest<void>({ runServices })
}
