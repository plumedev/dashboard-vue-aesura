/**
 * 🧪 TESTS UNITAIRES — moneyHelpers.ts
 *
 * Démonstration de tests pour des calculs financiers.
 * Les calculs d'argent sont un cas d'usage PARFAIT pour les tests
 * car les erreurs de précision (0.1 + 0.2 = 0.30000000000000004)
 * peuvent avoir des conséquences réelles.
 */

import { describe, it, expect } from 'vitest'
import {
  safeAdd,
  safeSubtract,
  safeMultiply,
  safeDivide,
  formatMoney,
} from '@/helpers/moneyHelpers'

// ─────────────────────────────────────────────────────────────
// 📦 safeAdd — Addition précise de montants
// ─────────────────────────────────────────────────────────────
describe('safeAdd', () => {
  it('devrait additionner des montants simples', () => {
    expect(safeAdd([10, 20, 30])).toBe(60)
  })

  it('devrait gérer la précision des flottants', () => {
    // ⚠️ En JavaScript pur : 10.1 + 20.2 + 30.3 = 60.599999999999994
    // Avec big.js : 60.6 ✅
    expect(safeAdd([10.1, 20.2, 30.3])).toBe(60.6)
  })

  it('devrait ignorer les valeurs null et undefined', () => {
    expect(safeAdd([10, null, 20, undefined, 30])).toBe(60)
  })

  it('devrait accepter des montants en string', () => {
    expect(safeAdd(['10.5', '20.5'])).toBe(31)
  })

  it('devrait retourner 0 pour un tableau vide', () => {
    expect(safeAdd([])).toBe(0)
  })

  it('devrait ignorer les valeurs NaN', () => {
    expect(safeAdd([10, 'abc', 20])).toBe(30)
  })
})

// ─────────────────────────────────────────────────────────────
// 📦 safeSubtract — Soustraction précise
// ─────────────────────────────────────────────────────────────
describe('safeSubtract', () => {
  it('devrait soustraire deux montants', () => {
    expect(safeSubtract(100, 30)).toBe(70)
  })

  it('devrait gérer la précision des flottants', () => {
    // ⚠️ En JavaScript pur : 10.1 - 3.2 = 6.8999999999999995
    expect(safeSubtract(10.1, 3.2)).toBe(6.9)
  })

  it('devrait gérer les valeurs null', () => {
    expect(safeSubtract(null, 10)).toBe(-10)
    expect(safeSubtract(10, null)).toBe(10)
  })

  it('devrait retourner 0 si les deux valeurs sont null', () => {
    expect(safeSubtract(null, null)).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────
// 📦 safeMultiply — Multiplication précise
// ─────────────────────────────────────────────────────────────
describe('safeMultiply', () => {
  it('devrait multiplier deux montants', () => {
    expect(safeMultiply(5, 3)).toBe(15)
  })

  it('devrait gérer la multiplication par 0', () => {
    expect(safeMultiply(100, 0)).toBe(0)
  })

  it('devrait gérer des valeurs null (traitées comme 0)', () => {
    expect(safeMultiply(null, 10)).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────
// 📦 safeDivide — Division précise avec protection division/0
// ─────────────────────────────────────────────────────────────
describe('safeDivide', () => {
  it('devrait diviser deux montants', () => {
    expect(safeDivide(100, 4)).toBe(25)
  })

  it('devrait retourner 0 en cas de division par zéro', () => {
    // C'est un comportement protectif important à tester !
    expect(safeDivide(100, 0)).toBe(0)
  })

  it('devrait retourner 0 en cas de division par "0" (string)', () => {
    expect(safeDivide(100, '0')).toBe(0)
  })

  it('devrait gérer null comme diviseur (fallback à 1)', () => {
    expect(safeDivide(10, null)).toBe(10)
  })
})

// ─────────────────────────────────────────────────────────────
// 📦 formatMoney — Formatage en euros
// ─────────────────────────────────────────────────────────────
describe('formatMoney', () => {
  it('devrait formater un montant en euros', () => {
    const result = formatMoney(1234.56)

    // On vérifie les éléments essentiels du formatage
    expect(result).toContain('€')
    // Note : le format exact peut varier selon l'environnement
    // On vérifie donc les éléments clés plutôt qu'une chaîne exacte
  })

  it('devrait accepter des montants en string', () => {
    const result = formatMoney('42')
    expect(result).toContain('€')
  })

  it('devrait formater 0 correctement', () => {
    const result = formatMoney(0)
    expect(result).toContain('€')
  })
})
