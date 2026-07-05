import { FINE_RATE_PER_DAY } from './constants.js';

export function calculateOverdueDays(dueDate: Date, fromDate: Date = new Date()): number {
  return Math.max(0, Math.ceil((fromDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
}

export function calculateFineAmount(overdueDays: number, quantity: number = 1): number {
  return overdueDays * FINE_RATE_PER_DAY * quantity;
}
