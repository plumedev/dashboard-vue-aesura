import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  type QueryConstraint,
  type DocumentData,
  DocumentSnapshot
} from 'firebase/firestore'
import { getDb } from '@/config/firebase'
import { useRequest } from '@/composables/utils/useRequest'
import { useToast } from '@nuxt/ui/composables'
import { useAuthStore } from '@/stores/authStore'

export interface ReadFireDocParams {
  collectionName: string
  documentId?: string
  queryConstraints?: QueryConstraint[]
  requireAuth?: boolean
}

export function useReadFireDoc() {
  const { add: addToast } = useToast()
  const authStore = useAuthStore()

  const runServices = async ({
    collectionName,
    documentId,
    queryConstraints = [],
    requireAuth = true
  }: ReadFireDocParams): Promise<DocumentData | DocumentData[] | null> => {
    try {
      const db = getDb()

      if (documentId) {
        const docRef = doc(db, collectionName, documentId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() }

          if (requireAuth && authStore.userId && (data as { userId?: string }).userId !== authStore.userId) {
            throw new Error("Vous n'avez pas accès à ce document")
          }

          return data
        } else {
          return null
        }
      } else {
        const constraints: QueryConstraint[] = [...queryConstraints]

        if (requireAuth && authStore.userId) {
          constraints.push(where('userId', '==', authStore.userId))
        }

        const q = query(collection(db, collectionName), ...constraints)
        const querySnapshot = await getDocs(q)

        const result = querySnapshot.docs.map((docSnap: DocumentSnapshot) => ({
          id: docSnap.id,
          ...docSnap.data()
        }))

        return result
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

  return useRequest<DocumentData | DocumentData[] | null>({
    runServices
  })
}
