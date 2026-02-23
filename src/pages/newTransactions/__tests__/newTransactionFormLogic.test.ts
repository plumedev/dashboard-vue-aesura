/**
 * 🧪 TESTS DE LOGIQUE DE COMPOSANT — newTransactionView
 *
 * NIVEAU 2 : Tests de la logique métier du formulaire de transaction.
 *
 * STRATÉGIE : Plutôt que de monter le composant complet (qui dépend de
 * Firebase, Nuxt UI, Pinia, etc.), on extrait et teste la LOGIQUE PURE
 * du formulaire séparément. C'est une bonne pratique qui rend le code
 * plus testable ET plus maintenable.
 *
 * Ce qu'on teste ici :
 *   ✅ La validation du formulaire (isFormValid)
 *   ✅ Le calcul des dates selon la fréquence
 *   ✅ La construction des données de transaction
 *   ✅ Les cas limites (champs vides, montants invalides, etc.)
 */

import { describe, it, expect } from 'vitest'
import {
  validateTransactionForm,
  computeDateRangeForFrequency,
  buildTransactionData,
  type TransactionFormState,
} from '../newTransactionFormLogic.ts'

// ─────────────────────────────────────────────────────────────
// 📦 Validation du formulaire
// ─────────────────────────────────────────────────────────────
describe('validateTransactionForm', () => {
  // 💡 Helper : crée un état de formulaire valide par défaut
  // Cela évite de re-écrire tous les champs dans chaque test
  const validForm: TransactionFormState = {
    name: 'Salaire',
    amount: 2500,
    account: 'account-123',
    type: 'income',
    frequency: 'monthly',
    startDate: { year: 2026, month: 1, day: 15 },
    endDate: { year: 2026, month: 2, day: 15 },
  }

  it('devrait valider un formulaire complet et correct', () => {
    const result = validateTransactionForm(validForm)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  // ─── Tests par champ ─────────────────────────────────────

  it('devrait rejeter un nom vide', () => {
    const form = { ...validForm, name: '' }
    const result = validateTransactionForm(form)

    expect(result.isValid).toBe(false)
    // toContainEqual() → Vérifie qu'un tableau contient un objet correspondant
    expect(result.errors).toContainEqual(expect.objectContaining({ field: 'name' }))
  })

  it('devrait rejeter un nom avec seulement des espaces', () => {
    const form = { ...validForm, name: '   ' }
    const result = validateTransactionForm(form)

    expect(result.isValid).toBe(false)
  })

  it('devrait rejeter un montant de 0', () => {
    const form = { ...validForm, amount: 0 }
    const result = validateTransactionForm(form)

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(expect.objectContaining({ field: 'amount' }))
  })

  it('devrait rejeter un montant null', () => {
    const form = { ...validForm, amount: null }
    const result = validateTransactionForm(form)

    expect(result.isValid).toBe(false)
  })

  it('devrait rejeter un montant négatif', () => {
    const form = { ...validForm, amount: -100 }
    const result = validateTransactionForm(form)

    expect(result.isValid).toBe(false)
  })

  it('devrait rejeter un compte non sélectionné', () => {
    const form = { ...validForm, account: '' }
    const result = validateTransactionForm(form)

    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(expect.objectContaining({ field: 'account' }))
  })

  it('devrait accepter un type "income"', () => {
    const form = { ...validForm, type: 'income' as const }
    const result = validateTransactionForm(form)
    expect(result.isValid).toBe(true)
  })

  it('devrait accepter un type "expense"', () => {
    const form = { ...validForm, type: 'expense' as const }
    const result = validateTransactionForm(form)
    expect(result.isValid).toBe(true)
  })

  it('devrait accepter toutes les fréquences valides', () => {
    const frequencies = ['once', 'monthly', 'quarterly', 'yearly'] as const
    frequencies.forEach(freq => {
      const form = { ...validForm, frequency: freq }
      const result = validateTransactionForm(form)
      expect(result.isValid).toBe(true)
    })
  })
})

// ─────────────────────────────────────────────────────────────
// 📦 Calcul des plages de dates selon la fréquence
// ─────────────────────────────────────────────────────────────
describe('computeDateRangeForFrequency', () => {
  // Date de référence fixe pour des tests déterministes
  const baseDate = new Date(2026, 0, 15) // 15 janvier 2026

  it('devrait retourner la même date pour "once"', () => {
    const result = computeDateRangeForFrequency('once', baseDate)

    expect(result.start.year).toBe(2026)
    expect(result.start.month).toBe(1) // Janvier
    expect(result.start.day).toBe(15)
    // Pour 'once', start === end
    expect(result.end.year).toBe(result.start.year)
    expect(result.end.month).toBe(result.start.month)
    expect(result.end.day).toBe(result.start.day)
  })

  it('devrait ajouter 1 mois pour "monthly"', () => {
    const result = computeDateRangeForFrequency('monthly', baseDate)

    expect(result.start.month).toBe(1) // Janvier
    expect(result.end.month).toBe(2) // Février
    expect(result.end.year).toBe(2026)
  })

  it('devrait ajouter 3 mois pour "quarterly"', () => {
    const result = computeDateRangeForFrequency('quarterly', baseDate)

    expect(result.start.month).toBe(1) // Janvier
    expect(result.end.month).toBe(4) // Avril
  })

  it('devrait ajouter 12 mois pour "yearly"', () => {
    const result = computeDateRangeForFrequency('yearly', baseDate)

    expect(result.start.year).toBe(2026)
    expect(result.end.year).toBe(2027)
    expect(result.end.month).toBe(1) // Même mois, année suivante
  })

  // ⚠️ Cas limite important : transition d'année
  it("devrait gérer le passage d'année (monthly en décembre)", () => {
    const december = new Date(2026, 11, 15) // 15 décembre 2026
    const result = computeDateRangeForFrequency('monthly', december)

    expect(result.end.year).toBe(2027)
    expect(result.end.month).toBe(1) // Janvier 2027
  })

  // ⚠️ Cas limite : quarterly en novembre (dépasse l'année)
  it("devrait gérer le passage d'année (quarterly en novembre)", () => {
    const november = new Date(2026, 10, 15) // 15 novembre 2026
    const result = computeDateRangeForFrequency('quarterly', november)

    expect(result.end.year).toBe(2027)
    expect(result.end.month).toBe(2) // Février 2027
  })
})

// ─────────────────────────────────────────────────────────────
// 📦 Construction des données de transaction
// ─────────────────────────────────────────────────────────────
describe('buildTransactionData', () => {
  const mockAccounts = [
    { id: 'acc-1', accountName: 'Compte Courant' },
    { id: 'acc-2', accountName: 'Épargne' },
  ]

  const validForm: TransactionFormState = {
    name: 'Loyer',
    amount: 800,
    account: 'acc-1',
    type: 'expense',
    frequency: 'monthly',
    startDate: { year: 2026, month: 1, day: 1 },
    endDate: { year: 2026, month: 2, day: 1 },
  }

  it('devrait construire les données correctement', () => {
    const result = buildTransactionData(validForm, mockAccounts)

    expect(result.name).toBe('Loyer')
    expect(result.amount).toBe(800)
    expect(result.type).toBe('expense')
    expect(result.frequency).toBe('monthly')
  })

  it("devrait résoudre le nom du compte à partir de l'ID", () => {
    const result = buildTransactionData(validForm, mockAccounts)

    expect(result.account.value).toBe('acc-1')
    expect(result.account.label).toBe('Compte Courant')
  })

  it('devrait convertir le montant string en number', () => {
    const form = { ...validForm, amount: '500.50' as unknown as number }
    const result = buildTransactionData(form, mockAccounts)

    expect(result.amount).toBe(500.5)
    expect(typeof result.amount).toBe('number')
  })

  it('devrait utiliser 0 comme montant par défaut si null', () => {
    const form = { ...validForm, amount: null }
    const result = buildTransactionData(form, mockAccounts)

    expect(result.amount).toBe(0)
  })

  it('devrait gérer un compte introuvable gracieusement', () => {
    const form = { ...validForm, account: 'inexistant' }
    const result = buildTransactionData(form, mockAccounts)

    expect(result.account.value).toBe('inexistant')
    expect(result.account.label).toBe('')
  })
})
