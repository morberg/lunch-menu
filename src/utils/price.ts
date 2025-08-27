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
    
    // Handle special cases where no numerical price is available
    const noPricePatterns = [
        /se restaurang/i,
        /kontakta restaurang/i,
        /ring restaurangen/i,
        /^-+$/,
        /^n\/?a$/i
    ];
    
    for (const pattern of noPricePatterns) {
        if (pattern.test(normalized)) {
            return null;
        }
    }
    
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

/**
 * Format a price for display
 * @param amount - Price amount in SEK
 * @returns Formatted price string or '-' if null
 */
export function formatPrice(amount: number | null): string {
    if (amount === null) {
        return '-';
    }
    
    // Format as whole number if no decimals, otherwise with decimals
    if (amount % 1 === 0) {
        return `${amount} kr`;
    } else {
        return `${amount.toFixed(2)} kr`;
    }
}
