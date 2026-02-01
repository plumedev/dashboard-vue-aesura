import Big from 'big.js'

/**
 * Helper pour les calculs monétaires précis avec big.js
 * Résout les problèmes de précision des nombres à virgule flottante JavaScript
 */

/**
 * Additionne plusieurs montants monétaires de manière précise
 *
 * @param amounts - Tableau de montants (number, string, null ou undefined)
 * @returns Le total en tant que number
 *
 * @example
 * safeAdd([10.1, 20.2, 30.3]) // 60.6 (au lieu de 60.599999999999994)
 */
export function safeAdd(amounts: (number | string | null | undefined)[]): number {
  return amounts
    .reduce((sum, amount) => {
      // Vérifier si la valeur est valide pour Big.js
      if (amount === null || amount === undefined || amount === '' || isNaN(Number(amount))) {
        return sum
      }
      // Convertir en Big pour éviter les erreurs de précision
      return sum.plus(new Big(amount))
    }, new Big(0))
    .toNumber()
}

/**
 * Soustrait deux montants de manière précise
 *
 * @param a - Montant à soustraire de
 * @param b - Montant à soustraire
 * @returns La différence en tant que number
 *
 * @example
 * safeSubtract(10.1, 3.2) // 6.9 (au lieu de 6.8999999999999995)
 */
export function safeSubtract(
  a: number | string | null | undefined,
  b: number | string | null | undefined
): number {
  const valA = a === null || a === undefined || a === '' || isNaN(Number(a)) ? 0 : a
  const valB = b === null || b === undefined || b === '' || isNaN(Number(b)) ? 0 : b
  return new Big(valA).minus(new Big(valB)).toNumber()
}

/**
 * Multiplie deux montants de manière précise
 *
 * @param a - Premier montant
 * @param b - Deuxième montant
 * @returns Le produit en tant que number
 */
export function safeMultiply(
  a: number | string | null | undefined,
  b: number | string | null | undefined
): number {
  const valA = a === null || a === undefined || a === '' || isNaN(Number(a)) ? 0 : a
  const valB = b === null || b === undefined || b === '' || isNaN(Number(b)) ? 0 : b
  return new Big(valA).times(new Big(valB)).toNumber()
}

/**
 * Divise deux montants de manière précise
 *
 * @param a - Dividende
 * @param b - Diviseur
 * @returns Le quotient en tant que number
 */
export function safeDivide(
  a: number | string | null | undefined,
  b: number | string | null | undefined
): number {
  const valA = a === null || a === undefined || a === '' || isNaN(Number(a)) ? 0 : a
  const valB = b === null || b === undefined || b === '' || isNaN(Number(b)) ? 1 : b // Éviter division par 0
  if (valB === 0 || valB === '0') return 0
  return new Big(valA).div(new Big(valB)).toNumber()
}

/**
 * Formate un montant en euros avec le formatage français
 *
 * @param amount - Le montant à formater
 * @returns Une chaîne formatée (ex: "1 234,56 €")
 */
export function formatMoney(amount: number | string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(amount))
}
