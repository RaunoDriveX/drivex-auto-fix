import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatInsurerName(insurerSlug: string): string {
  if (!insurerSlug) return '';
  
  // Split by hyphens and capitalize each word
  return insurerSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
