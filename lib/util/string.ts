/**
 * File: services/util/string.ts
 *
 * Overview:
 * - Service module encapsulating business logic, side effects, or integrations. Exports: formatTime, removeNumericPrefixes, timeSince, joinPath, basename, ...
 *
 * Dependencies:
 * - moment
 *
 * Architectural Notes:
 * - General utilities. Keep pure and side‑effect free for testability and reuse.
 *
 * Auto-generated header (2025-10-24). Review and refine as needed.
 */
import moment from "moment";

export const DIGIT_TO_SUPERSCRIPT: Record<string, string> = {
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
}

export const formatTime = (seconds: number): string => {
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};

export const removeNumericPrefixes = (text: string): string => {
    return text.replace(/\d+(?=[A-Za-z])/g, '');
};

export const timeSince = (since: number | Date): string => moment(since).fromNow();

export const joinPath = (...parts: string[]) => 
    // Simple POSIX-style join suitable for RNFS paths
    parts
        .filter(Boolean)
        .map((p) => p.replace(/\/+$/, ''))
        .join('/')
        .replace(/\/+/g, '/')

export const basename = (path: string) => path.split('/').pop() ?? ''

export const REGEX_VERSE_NUMBER = /(?:^|\s)(\d{1,2})(?=[A-Za-z])/g

export const cleanVerses = (text: string): string[] => {
    if (!text.trim()) {
        return [];
    }

    // Find all verse number matches with their positions
    const matches: Array<{ index: number; length: number }> = [];
    let match;
    const regex = new RegExp(REGEX_VERSE_NUMBER);
    
    while ((match = regex.exec(text)) !== null) {
        matches.push({
            index: match.index,
            length: match[0].length,
        });
    }

    // If no matches, return the cleaned text as a single verse
    if (matches.length === 0) {
        return [text.replace(/\n/g, '').trim()];
    }

    // Split the text at verse boundaries
    const verses: string[] = [];
    
    // Handle text before first verse
    if (matches[0].index > 0) {
        regex.lastIndex = 0;
        const firstVerse = text.substring(0, matches[0].index)
            .replace(regex, '') // Strip verse number prefix
            .replace(/\n/g, '') // Remove all newlines
            .trim(); // Trim leading and trailing whitespace
        if (firstVerse) {
            verses.push(firstVerse);
        }
    }

    // Process each verse
    for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index + matches[i].length;
        const end = i < matches.length - 1 ? matches[i + 1].index : text.length;
        
        regex.lastIndex = 0;
        const verse = text.substring(start, end)
            .replace(regex, '') // Strip verse number prefix
            .replace(/\n/g, '') // Remove all newlines
            .trim(); // Trim leading and trailing whitespace
        
        if (verse) {
            verses.push(verse);
        }
    }

    return verses;
};

export const slugify = (s: string): string =>
    s
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

/**
 * Apple ID email domain constant
 */
export const APPLE_ID_EMAIL_DOMAIN = 'appleid.com';

/**
 * Checks if an email address is an Apple ID email
 */
export const isAppleIdEmail = (email: string | null | undefined): boolean => {
    return !!email && email.includes(APPLE_ID_EMAIL_DOMAIN);
};

/**
 * Formats an email address for display. For Apple ID emails, returns only the username part (before @).
 * For other emails, returns the full email address.
 */
export const formatEmailForDisplay = (email: string | null | undefined): string => {
    if (!email) return '';
    if (isAppleIdEmail(email)) {
        return email.split('@')[0];
    }
    return email;
};

/**
 * Get recency group label for a given date
 */
export const getRecencyGroup = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
  
    if (diffDays === 0) {
        return 'Today';
    }
    if (diffDays === 1) {
        return 'Yesterday';
    }
    if (diffDays < 7) {
        return 'This Week';
    }
    if (diffMonths === 0) {
        return 'This Month';
    }
    if (diffMonths === 1) {
        return '2 months ago';
    }
    if (diffMonths === 2) {
        return '3 months ago';
    }
    if (diffMonths < 12) {
        return `${diffMonths + 1} months ago`;
    }
    if (diffYears === 1) {
        return 'Last year';
    }
    if (diffYears === 2) {
        return 'Two years ago';
    }
    return `${diffYears} years ago`;
};
