/**
 * Convertit une date au format ISO "2026-01-30" (YYYY-MM-DD)
 * en objet Date JavaScript dans le fuseau horaire local.
 *
 * @param dateString - La date au format "YYYY-MM-DD"
 * @returns Un objet Date JavaScript
 * @throws {Error} Si le format de date n'est pas reconnu
 */
export function parseDate(dateString: string): Date {
  // Pattern: "2026-01-30"
  const pattern = /^(\d{4})-(\d{2})-(\d{2})$/
  const match = dateString.match(pattern)

  if (!match) {
    // Si le format ne correspond pas, essaie de parser avec Date() natif
    const parsed = new Date(dateString)
    if (isNaN(parsed.getTime())) {
      throw new Error(`Format de date non reconnu: ${dateString}`)
    }
    return parsed
  }

  const [, year, month, day] = match

  // Créer la date dans le fuseau horaire local (minuit local)
  // Note: month - 1 car les mois sont indexés de 0 à 11 en JavaScript
  return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10))
}
