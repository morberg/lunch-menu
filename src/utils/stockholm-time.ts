export const STOCKHOLM_TIME_ZONE = 'Europe/Stockholm';
export const DAILY_REFRESH_HOUR = 10;

interface CalendarParts {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
}

const stockholmFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: STOCKHOLM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
});

function getCalendarParts(date: Date): CalendarParts {
    const parts = stockholmFormatter.formatToParts(date);
    const valueFor = (type: Intl.DateTimeFormatPartTypes): number => {
        const part = parts.find((candidate) => candidate.type === type);
        if (!part) {
            throw new Error(`Missing ${type} in Stockholm date`);
        }
        return Number(part.value);
    };

    return {
        year: valueFor('year'),
        month: valueFor('month'),
        day: valueFor('day'),
        hour: valueFor('hour'),
        minute: valueFor('minute'),
        second: valueFor('second')
    };
}

function asUtcTimestamp(parts: CalendarParts): number {
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

function stockholmLocalTimeToUtc(parts: CalendarParts): number {
    const expectedTimestamp = asUtcTimestamp(parts);
    let timestamp = expectedTimestamp;

    for (let attempt = 0; attempt < 3; attempt += 1) {
        const actualTimestamp = asUtcTimestamp(getCalendarParts(new Date(timestamp)));
        timestamp += expectedTimestamp - actualTimestamp;
    }

    return timestamp;
}

function nextCalendarDate(parts: CalendarParts): Pick<CalendarParts, 'year' | 'month' | 'day'> {
    const nextDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
    return {
        year: nextDate.getUTCFullYear(),
        month: nextDate.getUTCMonth() + 1,
        day: nextDate.getUTCDate()
    };
}

export function getNextStockholmRefresh(now: Date = new Date()): Date {
    const currentParts = getCalendarParts(now);
    let refreshParts: CalendarParts = {
        ...currentParts,
        hour: DAILY_REFRESH_HOUR,
        minute: 0,
        second: 0
    };
    let refreshTimestamp = stockholmLocalTimeToUtc(refreshParts);

    if (refreshTimestamp <= now.getTime()) {
        refreshParts = {
            ...refreshParts,
            ...nextCalendarDate(currentParts)
        };
        refreshTimestamp = stockholmLocalTimeToUtc(refreshParts);
    }

    return new Date(refreshTimestamp);
}

export function millisecondsUntilNextStockholmRefresh(now: Date = new Date()): number {
    return getNextStockholmRefresh(now).getTime() - now.getTime();
}

export function secondsUntilNextStockholmRefresh(now: Date = new Date()): number {
    return Math.max(1, Math.ceil(millisecondsUntilNextStockholmRefresh(now) / 1_000));
}