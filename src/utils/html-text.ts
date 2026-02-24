/**
 * Extracts visible text from an HTML string without a full DOM parse.
 * Much faster than `cheerio.load(html)` + `$('body').text()` on large pages.
 *
 * Removes <script>, <style>, <noscript> blocks, then strips all remaining tags
 * and decodes common HTML entities.
 */
export function htmlToText(html: string): string {
    return html
        // Remove <script>…</script>, <style>…</style>, <noscript>…</noscript> blocks
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
        // Strip all remaining tags
        .replace(/<[^>]+>/g, ' ')
        // Decode common HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
        .replace(/&[a-z]+;/g, ' ')
        // Normalise whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Extracts visible text from the <body> of an HTML string.
 * Falls back to full-document extraction if no <body> tag is found.
 */
export function bodyText(html: string): string {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return htmlToText(bodyMatch ? bodyMatch[1] : html);
}
