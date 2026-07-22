export const SWEDISH_DAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'] as const;
export const ENGLISH_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
export const ALL_WEEK = 'Hela veckan' as const;

export type SwedishDay = (typeof SWEDISH_DAYS)[number];
export type EnglishDay = (typeof ENGLISH_DAYS)[number];
export type MenuDay = SwedishDay | typeof ALL_WEEK;

const ENGLISH_TO_SWEDISH_DAY: Record<EnglishDay, SwedishDay> = Object.fromEntries(
    ENGLISH_DAYS.map((day, index) => [day, SWEDISH_DAYS[index]])
) as Record<EnglishDay, SwedishDay>;

const DAY_BY_LABEL: Record<string, SwedishDay> = {
    ...Object.fromEntries(SWEDISH_DAYS.map((day) => [day.toLowerCase(), day])),
    ...Object.fromEntries(ENGLISH_DAYS.map((day) => [day.toLowerCase(), ENGLISH_TO_SWEDISH_DAY[day]]))
};

const normalizeDayName = (value: string): SwedishDay | null =>
    DAY_BY_LABEL[value.trim().toLowerCase()] ?? null;

export const translateEnglishDay = (day: EnglishDay): SwedishDay =>
    ENGLISH_TO_SWEDISH_DAY[day];

export const parseDay = (value: string): SwedishDay | null => {
    const firstToken = value.trim().split(/[\s,]+/)[0];
    return firstToken ? normalizeDayName(firstToken) : null;
};

export const findDay = (value: string): SwedishDay | null => {
    const tokens = value.trim().split(/\s+/);
    for (const token of tokens) {
        const day = normalizeDayName(token);
        if (day) {
            return day;
        }
    }
    return null;
};

export interface LeadingDay {
    day: SwedishDay;
    text: string;
}

export const extractLeadingDay = (value: string): LeadingDay | null => {
    const normalized = value.replace(/\s+/g, ' ').trim();
    const match = normalized.match(/^([^\s:–—-]+)(?:\s*[-–—:]\s*|\s+|$)(.*)$/);
    if (!match) {
        return null;
    }

    const day = normalizeDayName(match[1]);
    if (!day) {
        return null;
    }

    return {
        day,
        text: match[2].trim()
    };
};

export const compareDays = (left: MenuDay, right: MenuDay): number => {
    const leftIndex = left === ALL_WEEK ? SWEDISH_DAYS.length : SWEDISH_DAYS.indexOf(left);
    const rightIndex = right === ALL_WEEK ? SWEDISH_DAYS.length : SWEDISH_DAYS.indexOf(right);
    return leftIndex - rightIndex;
};