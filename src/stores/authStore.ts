import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from 'firebase/auth'
import { getAuthInstance } from '@/config/firebase'
import { onAuthStateChanged } from 'firebase/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(true)

  const isAuthenticated = computed(() => user.value !== null)
  const userId = computed(() => user.value?.uid ?? null)

  const initAuth = () => {
    const auth = getAuthInstance()

    const currentUser = auth.currentUser
    if (currentUser) {
      user.value = currentUser
      isLoading.value = false
    } else {
      isLoading.value = true
    }

    onAuthStateChanged(auth, firebaseUser => {
      user.value = firebaseUser
      isLoading.value = false
    })
  }

  const setUser = (firebaseUser: User | null) => {
    user.value = firebaseUser
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    userId,
    initAuth,
    setUser,
  }
})
