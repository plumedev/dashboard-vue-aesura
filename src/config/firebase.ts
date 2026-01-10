import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'

let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null

export const initFirebase = (config?: {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket?: string
  messagingSenderId?: string
  appId?: string
}) => {
  if (!app) {
    // Si aucune config n'est fournie, utiliser les variables d'environnement
    const firebaseConfig = config || {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }

    // Vérifier que les clés obligatoires sont présentes
    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
      throw new Error(
        "Configuration Firebase manquante. Vérifiez que les variables d'environnement VITE_FIREBASE_* sont définies."
      )
    }

    app = initializeApp(firebaseConfig)
    db = getFirestore(app)
    auth = getAuth(app)
  }
  return { app, db, auth }
}

export const getDb = (): Firestore => {
  if (!db) {
    throw new Error("Firebase n'est pas initialisé. Appelez initFirebase() d'abord.")
  }
  return db
}

export const getAuthInstance = (): Auth => {
  if (!auth) {
    throw new Error("Firebase Auth n'est pas initialisé. Appelez initFirebase() d'abord.")
  }
  return auth
}
