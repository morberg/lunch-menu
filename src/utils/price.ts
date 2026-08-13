/**
 * Price parsing utilities for menu items
 */

/**
 * Parse a price string and extract numerical value
 * @param priceText - Raw price text from scraper
 * @returns Numerical price in SEK or null if not available
 */
export function parsePrice(priceText: string): number | null {
    // Normalize the text
    const normalized = priceText.trim();

    // Extract numerical price
    const priceMatch = normalized.match(/(\d+(?:[.,]\d{2})?)\s*(?:kr|:-|sek)?/i);

    if (priceMatch) {
        const amountStr = priceMatch[1].replace(',', '.');
        const amount = parseFloat(amountStr);

        return isNaN(amount) ? null : amount;
    }

    // If no pattern matches, return null
    return null;
}
