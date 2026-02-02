import { Timestamp } from 'firebase/firestore'
import { CalendarDate } from '@internationalized/date'

/**
 * Convertit une date au format ISO "2026-01-30" (YYYY-MM-DD)
 * en objet Date JavaScript dans le fuseau horaire local.
 *
 * @param dateString - La date au format "YYYY-MM-DD"
 * @returns Un objet Date JavaScript
 * @throws {Error} Si le format de date n'est pas reconnu
 */
export function parseDate(dateString: string): Date {
  const pattern = /^(\d{4})-(\d{2})-(\d{2})$/
  const match = dateString.match(pattern)

  if (!match) {
    const parsed = new Date(dateString)
    if (isNaN(parsed.getTime())) {
      throw new Error(`Format de date non reconnu: ${dateString}`)
    }
    return parsed
  }

  const [, year, month, day] = match

  return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10))
}

/**
 * Convertit une date (string ISO ou Date) en Timestamp Firebase.
 *
 * @param date - La date à convertir (string ISO ou Date)
 * @param isEndDate - Si true, ajoute 1 jour pour la date de fin
 * @returns Un Timestamp Firebase
 */
export function toFirestoreTimestamp(date: string | Date, isEndDate = false): Timestamp {
  const adjustedDate = new Date(date)

  if (isEndDate) {
    adjustedDate.setDate(adjustedDate.getDate() + 1)
  }

  return Timestamp.fromDate(adjustedDate)
}

/**
 * Convertit une date (Timestamp Firestore, string ou Date) en Date JavaScript.
 * Gère les cas où la date est null ou undefined en retournant la date actuelle.
 * Pour les strings au format "YYYY-MM-DD", utilise parseDate pour éviter les problèmes de fuseau horaire.
 *
 * @param date - La date à convertir (Timestamp, string, Date, null ou undefined)
 * @returns Un objet Date JavaScript
 */
export function toDate(date: Date | Timestamp | string | null | undefined): Date {
  if (!date) {
    return new Date()
  }

  if (date instanceof Date) {
    return date
  }

  if (date instanceof Timestamp) {
    return date.toDate()
  }

  if (typeof date === 'string') {
    const yyyyMmDdPattern = /^(\d{4})-(\d{2})-(\d{2})$/
    if (yyyyMmDdPattern.test(date)) {
      try {
        return parseDate(date)
      } catch {
        return new Date(date)
      }
    }
    return new Date(date)
  }

  return new Date()
}

/**
 * Formate une date en français avec date et heure.
 *
 * @param date - La date à formater (Timestamp, string, Date, null ou undefined)
 * @returns Une chaîne formatée en français (ex: "15 janv. 2026, 11:00")
 */
export function formatDate(date: Date | Timestamp | string | null | undefined): string {
  const dateObj = toDate(date)

  return dateObj.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Formate une date en français avec le mois complet.
 *
 * @param date - La date à formater (Timestamp, string, Date, null ou undefined)
 * @returns Une chaîne formatée en français (ex: "15 janvier 2026")
 */
export function formatLongDate(date: Date | Timestamp | string | null | undefined): string {
  const dateObj = toDate(date)

  return dateObj.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Convertit un Timestamp Firestore en CalendarDate.
 *
 * @param timestamp - Le Timestamp à convertir
 * @returns Un CalendarDate
 */
export function timestampToCalendarDate(timestamp: Timestamp): CalendarDate {
  const date = timestamp.toDate()
  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

/**
 * Convertit un CalendarDate en Timestamp Firestore.
 *
 * @param calendarDate - Le CalendarDate à convertir
 * @returns Un Timestamp Firestore
 */
export function calendarDateToTimestamp(calendarDate: {
  year: number
  month: number
  day: number
}): Timestamp {
  const jsDate = new Date(calendarDate.year, calendarDate.month - 1, calendarDate.day)
  return Timestamp.fromDate(jsDate)
}
