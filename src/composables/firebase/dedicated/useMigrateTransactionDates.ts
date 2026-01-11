/**
 * Composable de migration DEV uniquement
 * Convertit les dates string (format "2026-01-30") en Timestamp Firebase
 * pour les champs effectDate et effectEndDate des transactions
 */
import { Timestamp, type DocumentData } from 'firebase/firestore'
import { useReadFireDoc } from '../useReadFireDoc'
import { useUpdateFireDoc } from '../useUpdateFireDoc'
import { useToast } from '@nuxt/ui/composables'

/**
 * Convertit une date string "2026-01-30" en Timestamp Firebase
 * avec l'heure fixée à 11:00:00 dans le fuseau horaire local
 */
function stringToTimestamp(dateString: string): Timestamp {
  // Pattern: "2026-01-30"
  const pattern = /^(\d{4})-(\d{2})-(\d{2})$/
  const match = dateString.match(pattern)

  if (!match) {
    throw new Error(`Format de date non reconnu: ${dateString}. Format attendu: YYYY-MM-DD`)
  }

  const [, year, month, day] = match

  // Créer la date à 11:00:00 dans le fuseau horaire local
  const date = new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1, // Les mois sont indexés de 0 à 11
    parseInt(day, 10),
    11, // Heure: 11
    0,  // Minutes: 0
    0   // Secondes: 0
  )

  return Timestamp.fromDate(date)
}

/**
 * Vérifie si une valeur est une date string au format "YYYY-MM-DD"
 */
function isDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const pattern = /^\d{4}-\d{2}-\d{2}$/
  return pattern.test(value)
}

/**
 * Vérifie si une valeur est déjà un Timestamp Firebase
 */
function isTimestamp(value: unknown): value is Timestamp {
  return value instanceof Timestamp || (typeof value === 'object' && value !== null && 'seconds' in value && 'nanoseconds' in value)
}

export interface MigrationResult {
  total: number
  updated: number
  skipped: number
  errors: Array<{ documentId: string; error: string }>
}

export function useMigrateTransactionDates() {
  const { add: addToast } = useToast()
  const { doRequest: readTransactions } = useReadFireDoc()
  const { doRequest: updateTransaction } = useUpdateFireDoc()

  const migrate = async (): Promise<MigrationResult> => {
    const result: MigrationResult = {
      total: 0,
      updated: 0,
      skipped: 0,
      errors: []
    }

    try {
      console.log('🔄 Début de la migration des dates...')

      // Lire toutes les transactions (sans filtre auth pour le dev)
      const transactions = await readTransactions({
        collectionName: 'transactions',
        requireAuth: false
      }) as DocumentData[]

      if (!Array.isArray(transactions)) {
        throw new Error('Les transactions ne sont pas un tableau')
      }

      result.total = transactions.length
      console.log(`📊 ${result.total} transaction(s) trouvée(s)`)

      // Traiter chaque transaction
      for (const transaction of transactions) {
        const documentId = transaction.id as string
        if (!documentId) {
          result.errors.push({
            documentId: 'unknown',
            error: 'ID de document manquant'
          })
          continue
        }

        const updates: Partial<DocumentData> = {}
        let needsUpdate = false

        try {
          // Vérifier et convertir effectDate
          if ('effectDate' in transaction) {
            const effectDate = transaction.effectDate

            if (isDateString(effectDate)) {
              // Convertir la string en Timestamp
              updates.effectDate = stringToTimestamp(effectDate)
              needsUpdate = true
              console.log(`  ✓ effectDate: "${effectDate}" → Timestamp(${updates.effectDate.toDate().toISOString()})`)
            } else if (isTimestamp(effectDate)) {
              // Déjà un Timestamp, on skip
              console.log(`  ⊘ effectDate: déjà un Timestamp, ignoré`)
            } else if (effectDate !== null && effectDate !== undefined) {
              // Format non reconnu
              console.warn(`  ⚠ effectDate: format non reconnu (${typeof effectDate}), ignoré`)
            }
          }

          // Vérifier et convertir effectEndDate
          if ('effectEndDate' in transaction) {
            const effectEndDate = transaction.effectEndDate

            if (isDateString(effectEndDate)) {
              // Convertir la string en Timestamp
              updates.effectEndDate = stringToTimestamp(effectEndDate)
              needsUpdate = true
              console.log(`  ✓ effectEndDate: "${effectEndDate}" → Timestamp(${updates.effectEndDate.toDate().toISOString()})`)
            } else if (isTimestamp(effectEndDate)) {
              // Déjà un Timestamp, on skip
              console.log(`  ⊘ effectEndDate: déjà un Timestamp, ignoré`)
            } else if (effectEndDate !== null && effectEndDate !== undefined) {
              // Format non reconnu
              console.warn(`  ⚠ effectEndDate: format non reconnu (${typeof effectEndDate}), ignoré`)
            }
          }

          // Mettre à jour le document si nécessaire
          if (needsUpdate) {
            await updateTransaction({
              collectionName: 'transactions',
              documentId,
              data: updates,
              showToast: false, // Pas de toast pour chaque mise à jour
              requireAuth: false // Pas de vérification auth pour le dev
            })
            result.updated++
            console.log(`  ✅ Document ${documentId} mis à jour`)
          } else {
            result.skipped++
            console.log(`  ⊘ Document ${documentId} ignoré (pas de conversion nécessaire)`)
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
          result.errors.push({
            documentId,
            error: errorMessage
          })
          console.error(`  ❌ Erreur sur le document ${documentId}:`, errorMessage)
        }
      }

      // Résumé
      console.log('\n📊 Résumé de la migration:')
      console.log(`  Total: ${result.total}`)
      console.log(`  Mis à jour: ${result.updated}`)
      console.log(`  Ignorés: ${result.skipped}`)
      console.log(`  Erreurs: ${result.errors.length}`)

      if (result.errors.length > 0) {
        console.error('❌ Erreurs:', result.errors)
      }

      // Toast de confirmation
      addToast({
        title: `Migration terminée: ${result.updated} document(s) mis à jour, ${result.skipped} ignoré(s), ${result.errors.length} erreur(s)`,
        color: result.errors.length > 0 ? 'warning' : 'success',
        timeout: 5000
      })

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de la migration'
      console.error('❌ Erreur fatale lors de la migration:', errorMessage)
      
      addToast({
        title: `Erreur lors de la migration: ${errorMessage}`,
        color: 'error',
        timeout: 5000
      })

      throw error
    }
  }

  return {
    migrate
  }
}
