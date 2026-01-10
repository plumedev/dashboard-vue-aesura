import { collection, addDoc, type DocumentData } from 'firebase/firestore'
import { getDb } from '@/config/firebase'
import { useRequest } from '@/composables/utils/useRequest'
import { useToast } from '@nuxt/ui/composables'
import { useAuthStore } from '@/stores/authStore'

export interface CreateFireDocParams {
  collectionName: string
  data: DocumentData
  showToast?: boolean
}

export function useCreateFireDoc() {
  const { add: addToast } = useToast()
  const authStore = useAuthStore()

  const runServices = async ({ collectionName, data, showToast = true }: CreateFireDocParams): Promise<string> => {
    try {
      if (!authStore.userId) {
        throw new Error('Vous devez être connecté pour créer un document')
      }

      const db = getDb()

      const dataWithUserId = {
        ...data,
        userId: authStore.userId
      }

      const docRef = await addDoc(collection(db, collectionName), dataWithUserId)
      if (showToast) {
        addToast({
          title: 'Document créé avec succès !',
          color: 'success'
        })
      }
      return docRef.id
    } catch (error: unknown) {
      if (error instanceof Error) {
        addToast({
          title: error.message,
          color: 'error'
        })
      }
      throw error
    }
  }

  return useRequest<string>({
    runServices
  })
}
