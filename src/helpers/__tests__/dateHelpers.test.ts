/**
 * 🧪 TESTS UNITAIRES — dateHelpers.ts
 *
 * Ce fichier montre comment écrire des tests unitaires pour des fonctions pures.
 * Les fonctions pures sont les PLUS FACILES à tester car elles n'ont pas d'effets de bord :
 *   → Même entrée = Même sortie, toujours.
 *
 * STRUCTURE D'UN TEST :
 *   describe('Nom du groupe')  → Regroupe des tests liés
 *   it('description du cas')   → Un cas de test spécifique
 *   expect(valeur)             → Vérifie que la valeur correspond à ce qu'on attend
 *
 * POUR LANCER CES TESTS :
 *   npx vitest run                    → Lance tous les tests une fois
 *   npx vitest                        → Lance en mode watch (relance automatiquement)
 *   npx vitest run dateHelpers        → Lance uniquement ce fichier
 */

import { describe, it, expect } from 'vitest'
import { parseDate, formatDate, formatLongDate, toDate } from '@/helpers/dateHelpers'

// ─────────────────────────────────────────────────────────────
// 📦 describe() — Regroupe les tests par fonctionnalité
// ─────────────────────────────────────────────────────────────
describe('parseDate', () => {
  // ✅ it() — Décrit UN cas de test précis
  // Bonne pratique : le nom commence par "should" ou "devrait"
  it('devrait parser une date au format YYYY-MM-DD', () => {
    const result = parseDate('2026-01-15')

    // expect() + toBe() → Vérifie une valeur exacte
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(0) // Janvier = 0 en JavaScript
    expect(result.getDate()).toBe(15)
  })

  it('devrait parser une date avec un autre format reconnu par le navigateur', () => {
    const result = parseDate('January 15, 2026')

    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(0)
    expect(result.getDate()).toBe(15)
  })

  // ✅ Tester les cas d'erreur est tout aussi important !
  it('devrait lever une erreur pour un format invalide', () => {
    // expect().toThrow() → Vérifie qu'une erreur est levée
    // On doit envelopper l'appel dans une fonction fléchée
    expect(() => parseDate('pas-une-date')).toThrow('Format de date non reconnu')
  })

  it('devrait lever une erreur pour une chaîne vide', () => {
    expect(() => parseDate('')).toThrow()
  })
})

// ─────────────────────────────────────────────────────────────
// 📦 toDate — Fonction avec plusieurs types d'entrée
// ─────────────────────────────────────────────────────────────
describe('toDate', () => {
  it('devrait retourner la date actuelle si null', () => {
    const result = toDate(null)

    // toBeInstanceOf() → Vérifie le type de l'objet
    expect(result).toBeInstanceOf(Date)

    // On vérifie que c'est "aujourd'hui" (à la seconde près)
    const now = new Date()
    expect(result.getFullYear()).toBe(now.getFullYear())
    expect(result.getMonth()).toBe(now.getMonth())
    expect(result.getDate()).toBe(now.getDate())
  })

  it('devrait retourner la date actuelle si undefined', () => {
    const result = toDate(undefined)
    expect(result).toBeInstanceOf(Date)
  })

  it("devrait retourner la même instance si c'est déjà un Date", () => {
    const original = new Date(2026, 0, 15)
    const result = toDate(original)

    // toBe() vérifie la RÉFÉRENCE (même objet en mémoire)
    expect(result).toBe(original)
  })

  it('devrait convertir une chaîne YYYY-MM-DD correctement', () => {
    const result = toDate('2026-06-15')

    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(5) // Juin = 5
    expect(result.getDate()).toBe(15)
  })
})

// ─────────────────────────────────────────────────────────────
// 📦 formatDate — Formatage de dates en français
// ─────────────────────────────────────────────────────────────
describe('formatDate', () => {
  it('devrait formater une date en français (format court)', () => {
    const date = new Date(2026, 0, 15) // 15 janvier 2026
    const result = formatDate(date)

    // toContain() → Vérifie qu'une chaîne contient un texte
    expect(result).toContain('15')
    expect(result).toContain('2026')
  })

  it('devrait gérer null en retournant la date du jour formatée', () => {
    const result = formatDate(null)

    // toBeDefined() → Vérifie que la valeur n'est pas undefined
    expect(result).toBeDefined()

    // Vérifie que c'est une chaîne non vide
    expect(result.length).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────
// 📦 formatLongDate — Formatage avec mois complet
// ─────────────────────────────────────────────────────────────
describe('formatLongDate', () => {
  it('devrait formater avec le mois complet en français', () => {
    const date = new Date(2026, 0, 15) // 15 janvier 2026
    const result = formatLongDate(date)

    expect(result).toContain('janvier')
    expect(result).toContain('2026')
  })

  it('devrait gérer tous les mois correctement', () => {
    // 💡 Astuce : on peut itérer pour tester plusieurs cas
    const months = [
      'janvier',
      'février',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'août',
      'septembre',
      'octobre',
      'novembre',
      'décembre',
    ]

    months.forEach((expectedMonth, index) => {
      const date = new Date(2026, index, 1)
      const result = formatLongDate(date)
      expect(result).toContain(expectedMonth)
    })
  })
})
