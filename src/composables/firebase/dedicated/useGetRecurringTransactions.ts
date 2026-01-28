import { useRequest } from '@/composables/utils/useRequest'
import type { DocumentData } from 'firebase/firestore'
import { useReadFireDoc } from '../useReadFireDoc'
import { useToast } from '@nuxt/ui/composables'

export function useGetRecurringTransactions() {
  const { doRequest: getTransactions } = useReadFireDoc()
  const { add } = useToast()

  const runServices = async (): Promise<DocumentData[]> => {
    try {
      const result = await getTransactions({
        collectionName: 'recurringTransactions',
      })

      if (!Array.isArray(result)) {
        throw new Error("Le résultat n'est pas un tableau")
      }

      return result
    } catch (error: unknown) {
      if (error instanceof Error) {
        add({
          title: 'Erreur récupération transactions récurrentes',
          description: error.message,
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
