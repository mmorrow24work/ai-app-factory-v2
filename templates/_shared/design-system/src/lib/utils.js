import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge conditional class lists with Tailwind-aware de-duplication, so a later conflicting
 * utility (e.g. a caller's own `bg-red-500` overriding a variant's `bg-primary`) wins instead
 * of both ending up in the class list.
 *
 * @param {...(string | undefined | null | false | Record<string, boolean>)} inputs
 * @returns {string}
 */
export function cn(...inputs) {
	return twMerge(clsx(inputs));
}
