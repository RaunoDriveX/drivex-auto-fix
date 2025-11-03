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

export function formatServiceType(serviceType: string): string {
  if (!serviceType) return '';
  
  const normalized = serviceType.toLowerCase().trim();
  
  if (normalized === 'repair') {
    return 'Windshield Repair';
  } else if (normalized === 'replacement') {
    return 'Windshield Replacement';
  }
  
  // Fallback: capitalize first letter
  return serviceType.charAt(0).toUpperCase() + serviceType.slice(1);
}
