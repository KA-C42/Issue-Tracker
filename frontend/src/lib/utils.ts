import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? '' : 's'}`
