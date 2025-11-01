import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge to resolve conflicts
 * 
 * @param {...ClassValue} inputs - Array of class names, conditional objects, or arrays
 * @returns {string} Merged and deduplicated class string
 * 
 * @example
 * ```tsx
 * cn('px-2 py-1', { 'bg-red': isActive }, 'text-white')
 * // Returns: "px-2 py-1 bg-red text-white"
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
