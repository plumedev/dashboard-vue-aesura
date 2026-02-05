import type { Timestamp } from 'firebase/firestore'

export interface IIteration {
  id: string
  date: Timestamp | Date
  amount: number
  name?: string
  type?: string
}
