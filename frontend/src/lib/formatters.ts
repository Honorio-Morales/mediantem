/**
 * lib/formatters.ts — Funciones de formateo reutilizables
 */

/**
 * Formatea un precio en soles peruanos
 * @example formatPrice(19.99) → "S/. 19.99"
 */
export function formatPrice(price: number): string {
    return `S/. ${price.toFixed(2)}`;
}

/**
 * Formatea una fecha ISO a formato legible en español
 * @example formatDate("2025-11-20T12:00:00Z") → "20 de noviembre de 2025"
 */
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

/**
 * Formatea un rating decimal
 * @example formatRating(4.9) → "4.9"
 */
export function formatRating(rating: number): string {
    return rating.toFixed(1);
}
