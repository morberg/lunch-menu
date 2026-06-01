import { normalizeWhitespace } from './scraper';

type LabelMatchMode = 'exact' | 'leading';

export function findLabelCaseInsensitive<T extends string>(
    value: string,
    labels: readonly T[],
    mode: LabelMatchMode = 'exact'
): T | null {
    const normalizedValue = normalizeWhitespace(value).toLowerCase();
    if (!normalizedValue) {
        return null;
    }

    return labels.find((label) => {
        const normalizedLabel = label.toLowerCase();
        return mode === 'leading'
            ? normalizedValue.startsWith(normalizedLabel)
            : normalizedValue === normalizedLabel;
    }) ?? null;
}