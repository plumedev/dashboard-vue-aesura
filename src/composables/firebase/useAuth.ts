import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User,
  type UserCredential
} from 'firebase/auth'
import { getAuthInstance } from '@/config/firebase'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@nuxt/ui/composables'

export function useAuth() {
  const { add: addToast } = useToast()
  const authStore = useAuthStore()

  const signInWithGoogle = async (): Promise<UserCredential> => {
    try {
      const auth = getAuthInstance()
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)

      authStore.setUser(userCredential.user)

      addToast({
        title: 'Connexion réussie !',
        color: 'success'
      })
      return userCredential
    } catch (error: unknown) {
      if (error instanceof Error) {
        let errorMessage = 'Erreur de connexion'
        const errorCode = (error as any).code || ''

        if (errorCode === 'auth/popup-closed-by-user' || error.message.includes('popup-closed-by-user')) {
          errorMessage = 'La fenêtre de connexion a été fermée'
        } else if (errorCode === 'auth/popup-blocked' || error.message.includes('popup-blocked')) {
          errorMessage = 'La fenêtre popup a été bloquée. Veuillez autoriser les popups pour ce site.'
        } else if (errorCode === 'auth/unauthorized-domain') {
          errorMessage = "Ce domaine n'est pas autorisé pour l'authentification Google"
        } else {
          errorMessage = `Erreur de connexion: ${error.message}`
        }

        addToast({
          title: errorMessage,
          color: 'error'
        })
      }
      throw error
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      const auth = getAuthInstance()
      await firebaseSignOut(auth)
      authStore.setUser(null)

      addToast({
        title: 'Déconnexion réussie',
        color: 'success'
      })
    } catch (error: unknown) {
      if (error instanceof Error) {
        addToast({
          title: `Erreur de déconnexion: ${error.message}`,
          color: 'error'
        })
      }

      throw error
    }
  }

  const getCurrentUser = (): User | null => {
    return authStore.user
  }

  return {
    signInWithGoogle,
    signOut,
    getCurrentUser
  }
}
