import { useRequest } from '@/composables/utils/useRequest'
import type { DocumentData } from 'firebase/firestore'
import { where, type QueryConstraint } from 'firebase/firestore'
import { useReadFireDoc } from '../useReadFireDoc'
import { toFirestoreTimestamp } from '@/helpers/dateHelpers'

export interface TransactionDateRange {
  start?: string | Date
  end?: string | Date
}

export interface GetTransactionByPeriodParams {
  dateRange?: TransactionDateRange
  dateField?: string // Nom du champ de date dans Firestore (par défaut: 'date')
}

const { doRequest: getTransactions } = useReadFireDoc()

export function useGetTransactionByPeriod() {
  const runServices = async (params?: GetTransactionByPeriodParams): Promise<DocumentData[]> => {
    try {
      const { dateRange, dateField = 'effectDate' } = params || {}
      const queryConstraints: QueryConstraint[] = []

      if (dateRange) {
        if (dateRange.start) {
          const startTimestamp = toFirestoreTimestamp(dateRange.start, false)
          queryConstraints.push(where(dateField, '>=', startTimestamp))
        }

        if (dateRange.end) {
          const endTimestamp = toFirestoreTimestamp(dateRange.end, true)
          queryConstraints.push(where(dateField, '<', endTimestamp))
        }
      }

      const result = await getTransactions({
        collectionName: 'transactions',
        queryConstraints,
      })

      if (!Array.isArray(result)) {
        throw new Error('Les transactions ne sont pas un tableau')
      }

      return result
    } catch (error: unknown) {
      const { add } = useToast()
      if (error instanceof Error) {
        add({
          title: error.message,
          color: 'error',
        })
      }
      throw error
    }
  }

  return useRequest<DocumentData[]>({
    runServices,
  })
}
