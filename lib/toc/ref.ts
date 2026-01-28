import type { BibleRef } from "./bible";

export type VerseRange = [number, number]

export const isFullRefString = (ref: string) : boolean => {
    // Expected "standard complete Bible reference" format used by the API, e.g.:
    // "Gen:1:2-3:4" or "Matt:6:33-6:33"
    // Grammar: <bookAbbv>:<startChapter>:<startVerse>-<endChapter>:<endVerse>
    // Note: the end side does NOT repeat the book abbreviation.
    const fullRefRe = /^[0-9A-Za-z]+:\d+:\d+-\d+:\d+$/
    return fullRefRe.test(ref)
}

export const refsSameChapter = (ref1: BibleRef | string, ref2: BibleRef | string) : boolean => {
    if (typeof ref1 === 'string') {
        ref1 = parseRefStringChapter(ref1)
    }
    if (typeof ref2 === 'string') {
        ref2 = parseRefStringChapter(ref2)
    }
    return ref1.bookAbbv === ref2.bookAbbv && ref1.chapter === ref2.chapter
}

export const refsEqual = (ref1: BibleRef | string, ref2: BibleRef | string) : boolean => {
    if (typeof ref1 === 'string') {
        ref1 = parseRefStringChapter(ref1)
    }
    if (typeof ref2 === 'string') {
        ref2 = parseRefStringChapter(ref2)
    }
    return refsSameChapter(ref1, ref2) && ref1.verse === ref2.verse
}

export const verseRangesOverlap = (range1: VerseRange, range2: VerseRange) : boolean => {
    const [start1, end1] = range1
    const [start2, end2] = range2
    return start1 <= end2 && end1 >= start2
}

export const sameChapterVerseRangeFromRefString = (ref: string) : VerseRange | null => {
    const [start, end] = parseRefString(ref)
    if (start.bookAbbv !== end.bookAbbv)
        return null
    if (start.chapter !== end.chapter)
        return null
    if (!start.verse || !end.verse)
        return null
    return [start.verse, end.verse]
}

export const parseRefString = (ref: string) : [BibleRef, BibleRef] => {
    const [bookAbbv] = ref.split(':', 1)
    const chapVerseRange = ref.substring(bookAbbv.length + 1)
    const [start, end] = chapVerseRange.split('-')
    const [startChapter, startVerse] = start.split(':')
    const [endChapter, endVerse] = end.split(':')
    return [
        {
            bookAbbv,
            chapter: parseInt(startChapter),
            verse: parseInt(startVerse),
        },
        {
            bookAbbv,
            chapter: parseInt(endChapter),
            verse: parseInt(endVerse),
        }
    ]
}
export const parseRefStringChapter = (ref: string) : BibleRef => {
    const [bookAbbv] = ref.split(':', 1)
    const chapVerseRange = ref.substring(bookAbbv.length + 1)
    const [start] = chapVerseRange.split('-')
    const [chapter] = start.split(':')

    // For now, we are only concerned with chapter-level granularity
    return {
        bookAbbv,
        chapter: parseInt(chapter),
    }
}

export const entriesOverlappingVerseRange = (verseRange: VerseRange) => 
    <T extends {ref:string}>(entry : T) => {
        const range = sameChapterVerseRangeFromRefString(entry.ref)
        if (!range)
            return false
        const result = verseRangesOverlap(range, verseRange)
        return result
    }

export const prettyRefSimple = (ref: BibleRef | [BibleRef, BibleRef]) : string => {
    if (Array.isArray(ref)) {
        const [start, end] = ref
        if (start.bookAbbv !== end.bookAbbv) {
            return `${start.bookAbbv} ${start.chapter}:${start.verse}-${end.bookAbbv} ${end.chapter}:${end.verse}`
        }
        if (start.chapter !== end.chapter) {
            return `${start.bookAbbv} ${start.chapter}:${start.verse}-${end.chapter}:${end.verse}`
        }
        if (start.verse !== end.verse) {
            return `${start.bookAbbv} ${start.chapter}:${start.verse}-${end.verse}`
        }
        return prettyRefSimple(start)
    }
    const {bookAbbv, chapter, verse} = ref
    if (typeof verse === 'undefined') {
        return `${bookAbbv} ${chapter}`
    }
    return `${bookAbbv} ${chapter}:${verse}`
}