export const SWEDISH_DAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'] as const;

export type SwedishDay = (typeof SWEDISH_DAYS)[number];

const ENGLISH_TO_SWEDISH_DAY: Record<string, SwedishDay> = {
    monday: 'Måndag',
    tuesday: 'Tisdag',
    wednesday: 'Onsdag',
    thursday: 'Torsdag',
    friday: 'Fredag'
};

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
