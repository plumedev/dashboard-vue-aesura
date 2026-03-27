/**
 * 📦 Logique pure du formulaire de transaction
 *
 * Ce fichier extrait la logique métier de newTransactionView.vue
 * pour la rendre TESTABLE INDÉPENDAMMENT du composant Vue.
 *
 * POURQUOI EXTRAIRE LA LOGIQUE ?
 * ────────────────────────────────
 * 1. Testabilité : On peut tester sans monter le composant Vue
 * 2. Réutilisabilité : La logique peut être utilisée ailleurs
 * 3. Lisibilité : Le composant Vue ne contient plus que du rendu
 * 4. Maintenabilité : Les règles métier sont centralisées ici
 *
 * Le composant Vue importe ces fonctions et les utilise dans ses
 * computed/methods. Les tests importent directement ce fichier.
 */

// ─────────────────────────────────────────────────────────────
// 📝 Types
// ─────────────────────────────────────────────────────────────

export interface SimpleDate {
  year: number
  month: number
  day: number
}

export interface TransactionFormState {
  name: string
  amount: number | null
  account: string
  type: 'income' | 'expense'
  frequency: 'once' | 'monthly' | 'quarterly' | 'yearly'
  startDate: SimpleDate
  endDate: SimpleDate
}

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export interface TransactionData {
  name: string
  amount: number
  type: 'income' | 'expense'
  account: { value: string; label: string }
  frequency: 'once' | 'monthly' | 'quarterly' | 'yearly'
  effectDate: SimpleDate
  effectEndDate: SimpleDate
}

// ─────────────────────────────────────────────────────────────
// ✅ Validation du formulaire
// ─────────────────────────────────────────────────────────────

/**
 * Valide l'état du formulaire de transaction.
 * Retourne un objet avec `isValid` et une liste d'erreurs détaillées.
 *
 * @param form - L'état actuel du formulaire
 * @returns Le résultat de la validation
 */
export function validateTransactionForm(form: TransactionFormState): ValidationResult {
  const errors: ValidationError[] = []

  // Validation du nom
  if (!form.name || form.name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'Le nom de la transaction est requis',
    })
  }

  // Validation du montant
  if (form.amount === null || form.amount === undefined || form.amount <= 0) {
    errors.push({
      field: 'amount',
      message: 'Le montant doit être supérieur à 0',
    })
  }

  // Validation du compte
  if (!form.account || form.account.trim() === '') {
    errors.push({
      field: 'account',
      message: 'Un compte doit être sélectionné',
    })
  }

  // Validation du type
  if (!form.type || !['income', 'expense'].includes(form.type)) {
    errors.push({
      field: 'type',
      message: 'Le type de transaction est invalide',
    })
  }

  // Validation de la fréquence
  if (!form.frequency || !['once', 'monthly', 'quarterly', 'yearly'].includes(form.frequency)) {
    errors.push({
      field: 'frequency',
      message: 'La fréquence est invalide',
    })
  }

  // Validation de la date de début
  if (!form.startDate) {
    errors.push({
      field: 'startDate',
      message: 'La date de début est requise',
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// ─────────────────────────────────────────────────────────────
// 📅 Calcul des plages de dates
// ─────────────────────────────────────────────────────────────

/**
 * Calcule la plage de dates (start/end) en fonction de la fréquence.
 *
 * @param frequency - La fréquence de la transaction
 * @param baseDate - La date de référence (par défaut : aujourd'hui)
 * @returns Un objet { start, end } avec des SimpleDate
 */
export function computeDateRangeForFrequency(
  frequency: 'once' | 'monthly' | 'quarterly' | 'yearly',
  baseDate: Date = new Date()
): { start: SimpleDate; end: SimpleDate } {
  const start: SimpleDate = {
    year: baseDate.getFullYear(),
    month: baseDate.getMonth() + 1, // JS months are 0-indexed
    day: baseDate.getDate(),
  }

  const endDate = new Date(baseDate)

  switch (frequency) {
    case 'monthly':
      endDate.setMonth(endDate.getMonth() + 1)
      break
    case 'quarterly':
      endDate.setMonth(endDate.getMonth() + 3)
      break
    case 'yearly':
      endDate.setFullYear(endDate.getFullYear() + 1)
      break
    case 'once':
    default:
      // Pour 'once', la date de fin est la même que la date de début
      break
  }

  const end: SimpleDate = {
    year: endDate.getFullYear(),
    month: endDate.getMonth() + 1,
    day: endDate.getDate(),
  }

  return { start, end }
}

// ─────────────────────────────────────────────────────────────
// 🏗️ Construction des données de transaction
// ─────────────────────────────────────────────────────────────

/**
 * Construit l'objet de données prêt pour la sauvegarde Firebase.
 *
 * @param form - L'état du formulaire
 * @param accounts - La liste des comptes disponibles
 * @returns Les données formatées pour Firestore
 */
export function buildTransactionData(
  form: TransactionFormState,
  accounts: { id: string; accountName: string }[]
): TransactionData {
  const selectedAccount = accounts.find(acc => acc.id === form.account)

  return {
    name: form.name,
    amount: Number(form.amount || 0),
    type: form.type,
    account: {
      value: selectedAccount?.id || form.account,
      label: selectedAccount?.accountName || '',
    },
    frequency: form.frequency,
    effectDate: form.startDate,
    effectEndDate: form.endDate,
  }
}
