export const SWEDISH_DAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'] as const;
export const ENGLISH_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

export type SwedishDay = (typeof SWEDISH_DAYS)[number];
export type EnglishDay = (typeof ENGLISH_DAYS)[number];


const ENGLISH_TO_SWEDISH_DAY: Record<string, SwedishDay> = Object.fromEntries(
    ENGLISH_DAYS.map((e, i) => [e, SWEDISH_DAYS[i]])
);

export const isSwedishDay = (value: string): value is SwedishDay =>
    SWEDISH_DAYS.includes(value as SwedishDay);

export const normalizeToSwedishDay = (value: string): SwedishDay | null => {
    const trimmed = value.trim();
    if (isSwedishDay(trimmed)) {
        return trimmed;
    }

    const englishMatch = ENGLISH_TO_SWEDISH_DAY[trimmed.toLowerCase()];
    return englishMatch ?? null;
};
