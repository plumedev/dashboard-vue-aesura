import { doc, updateDoc, getDoc, type DocumentData } from 'firebase/firestore'
import { getDb } from '@/config/firebase'
import { useRequest } from '@/composables/utils/useRequest'
import { useToast } from '@nuxt/ui/composables'
import { useAuthStore } from '@/stores/authStore'

export interface UpdateFireDocParams {
  collectionName: string
  documentId: string
  data: Partial<DocumentData>
  showToast?: boolean
  requireAuth?: boolean
}

export function useUpdateFireDoc() {
  const { add: addToast } = useToast()
  const authStore = useAuthStore()

  const runServices = async ({
    collectionName,
    documentId,
    data,
    showToast = true,
    requireAuth = true
  }: UpdateFireDocParams): Promise<void> => {
    try {
      if (requireAuth && !authStore.userId) {
        throw new Error('Vous devez être connecté pour modifier un document')
      }

      const db = getDb()
      const docRef = doc(db, collectionName, documentId)

      if (requireAuth && authStore.userId) {
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const existingData = docSnap.data()
          if (existingData.userId !== authStore.userId) {
            throw new Error("Vous n'avez pas la permission de modifier ce document")
          }
        }
      }

      // S'assurer que le userId n'est pas modifié
      const dataToUpdate = { ...data }
      if (requireAuth && authStore.userId && 'userId' in dataToUpdate) {
        delete dataToUpdate.userId
      }

      await updateDoc(docRef, dataToUpdate)
      if (showToast) {
        addToast({
          title: 'Transaction modifiée avec succès !',
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
