export const SWEDISH_DAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'] as const;

export type SwedishDay = (typeof SWEDISH_DAYS)[number];

export const isSwedishDay = (value: string): value is SwedishDay =>
    SWEDISH_DAYS.includes(value as SwedishDay);
