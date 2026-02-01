import { useRequest } from '@/composables/utils/useRequest'
import { collection, getDocs, query, orderBy, type DocumentData } from 'firebase/firestore'
import { getDb } from '@/config/firebase'

export function useGetIterations() {
  const runServices = async (transactionId: string): Promise<DocumentData[]> => {
    const db = getDb()
    const iterationsRef = collection(db, 'recurringTransactions', transactionId, 'iterations')
    const q = query(iterationsRef, orderBy('date', 'asc'))

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  }

  return useRequest<DocumentData[]>({ runServices })
}
