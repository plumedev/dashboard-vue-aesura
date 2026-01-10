import { doc, deleteDoc, getDoc } from 'firebase/firestore'
import { getDb } from '@/config/firebase'
import { useRequest } from '@/composables/utils/useRequest'
import { useToast } from '@nuxt/ui/composables'
import { useAuthStore } from '@/stores/authStore'

export interface DeleteFireDocParams {
  collectionName: string
  documentId: string
  showToast?: boolean
  requireAuth?: boolean
}

export function useDeleteFireDoc() {
  const { add: addToast } = useToast()
  const authStore = useAuthStore()

  const runServices = async ({
    collectionName,
    documentId,
    showToast = true,
    requireAuth = true
  }: DeleteFireDocParams): Promise<void> => {
    try {
      if (requireAuth && !authStore.userId) {
        throw new Error('Vous devez être connecté pour supprimer un document')
      }

      const db = getDb()
      const docRef = doc(db, collectionName, documentId)

      if (requireAuth && authStore.userId) {
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const existingData = docSnap.data()
          if (existingData.userId !== authStore.userId) {
            throw new Error("Vous n'avez pas la permission de supprimer ce document")
          }
        }
      }

      await deleteDoc(docRef)
      if (showToast) {
        addToast({
          title: 'Transaction supprimée avec succès !',
          color: 'success'
        })
      }
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

  return useRequest<void>({
    runServices
  })
}
