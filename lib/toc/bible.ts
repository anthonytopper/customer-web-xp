import { CFI } from "../cfi/helper";

export type BibleRef = {
    bookAbbv: string
    chapter: number
    verse?: number
}
export type BibleChapterCountMap = Record<string, number>
export type BibleBookNameMap = Record<string, string>

export interface BibleTOCData {
    chapterCounts: BibleChapterCountMap
    bookNames: BibleBookNameMap
}

export type CommentaryWordCounts = {
    [bookAbbv: string]: {
        [chapter: string]: number
    }
}

export class BibleTOC {

    private _commentaryWordCounts: CommentaryWordCounts = {}
    private _chapterCounts: BibleChapterCountMap
    private _bookNames: BibleBookNameMap
    constructor(chapterCounts: BibleChapterCountMap, bookNames: BibleBookNameMap) {
        this._chapterCounts = chapterCounts
        this._bookNames = bookNames
    }

    private _refToIndex(ref: BibleRef) {
        let counter = 0
        for (const bookAbbv in this._chapterCounts) {
            if (bookAbbv === ref.bookAbbv) {
                const found = counter + ref.chapter
                // New Testament
                if (found >= 930) {
                    return found + 1
                }
                return found
            }
            counter += this._chapterCounts[bookAbbv]
        }
        return counter
    }

    private _indexToRef(index: number) {
        if (index === 0) 
            return { bookAbbv: 'OT', chapter: 0 }
        if (index === 930) 
            return { bookAbbv: 'NT', chapter: 0 }
        if (index >= 930) 
            index -= 1
        let counter = 0
        for (const bookAbbv in this._chapterCounts) {
            if (counter + this._chapterCounts[bookAbbv] > index - 1) {
                return {
                    bookAbbv,
                    chapter: index - counter
                }
            }
            counter += this._chapterCounts[bookAbbv]
        }
        return null
    }

    // Gen:1:1-1:2
    

    prettyRefRange(start: BibleRef, end: BibleRef) {
        const startBookAbbv = start.bookAbbv
        const endBookAbbv = end.bookAbbv
        const startBookName = this.getBookName(startBookAbbv) ?? startBookAbbv
        const endBookName = this.getBookName(endBookAbbv) ?? endBookAbbv
        const hasStartVerse = typeof start.verse === 'number'
        const hasEndVerse = typeof end.verse === 'number'

        const sameBook = startBookAbbv === endBookAbbv
        const sameChapter = start.chapter === end.chapter

        // If both verses are provided, format as chapter:verse ranges
        if (hasStartVerse && hasEndVerse) {
            if (sameBook) {
                if (sameChapter) {
                    if (start.verse === end.verse) {
                        return `${startBookName} ${start.chapter}:${start.verse}`
                    }
                    return `${startBookName} ${start.chapter}:${start.verse}-${end.verse}`
                }
                return `${startBookName} ${start.chapter}:${start.verse}-${end.chapter}:${end.verse}`
            }
            return `${startBookName} ${start.chapter}:${start.verse}-${endBookName} ${end.chapter}:${end.verse}`
        }

        // If no verses provided, fall back to chapter-only range
        if (sameBook) {
            if (sameChapter) {
                return `${startBookName} ${start.chapter}`
            }
            return `${startBookName} ${start.chapter}-${end.chapter}`
        }
        return `${startBookName} ${start.chapter}-${endBookName} ${end.chapter}`
    }

    get chapterCounts() {
        return this._chapterCounts
    }

    get bookNames() {
        return this._bookNames
    }

    setCommentaryWordCounts(wordCounts: CommentaryWordCounts) {
        this._commentaryWordCounts = wordCounts
    }

    isDividerRef(ref: BibleRef) {
        const {bookAbbv} = ref
        if (bookAbbv === 'OT' || bookAbbv === 'NT') {
            return true
        }
        return false
    }

    isSectionValidForRef(ref: BibleRef) {
        const {bookAbbv, chapter} = ref
        if (bookAbbv === 'OT' || bookAbbv === 'NT') {
            return false
        }
        const wordCount = this._commentaryWordCounts[bookAbbv]?.[chapter]
        return typeof wordCount === 'number' ? wordCount > 0 : true
    }

    isChapterNumberValid(bookAbbv: string, chapter: number) {
        return chapter > 0 && chapter <= this.getChapterCount(bookAbbv)
    }

    getBookName(bookAbbv: string) : string | null {
        return this._bookNames[bookAbbv] ?? null
    }

    getSectionNumber(ref: BibleRef) : number {
        return this._refToIndex(ref)
    }

    getChapterCount(bookAbbv: string) : number {
        return this.chapterCounts[bookAbbv] || 0
    }

    getChapterCFI(ref: BibleRef) : string {
        const index = this._refToIndex(ref)
        return `epubcfi(/6/${(index + 1) * 2}!)`
    }

    getChapterRef(cfi: string) {
        const index = this.getChapterIndexForCFI(cfi)
        console.log('[BibleTOC] getChapterRef', index)
        return this._indexToRef(index)
    }

    getChapterIndexForCFI(cfi: string) {
        const index = CFI.fromString(cfi).spineIndex / 2 - 1
        return index
    }

    getRefForChapterIndex(index: number) {
        return this._indexToRef(index)
    }

    getChapterProgressPercent(cfi: string) {
        const index = this.getChapterIndexForCFI(cfi)
        return index / 1189 // total chapters in the bible
    }

    prettyRefForCFI(cfi: string) {
        const ref = this.getChapterRef(cfi)
        return ref ? this.prettyRef(ref) : ''
    }

    prettyRef(ref: BibleRef | [BibleRef, BibleRef]) {
        if (Array.isArray(ref)) {
            return this.prettyRefRange(ref[0], ref[1])
        }
        if (ref.bookAbbv === 'Gen' && ref.chapter === 0) {
            return 'Old Testament'
        }
        if (ref.bookAbbv === 'Matt' && ref.chapter === 0) {
            return 'New Testament'
        }
        if (ref.bookAbbv === 'OT') {
            return 'Old Testament'
        }
        if (ref.bookAbbv === 'NT') {
            return 'New Testament'
        }
        return `${this._bookNames[ref.bookAbbv]} ${ref.chapter}`
    }

    nextRef(ref: BibleRef) : BibleRef | null {
        const currentIndex = this._refToIndex(ref)
        const nextIndex = currentIndex + 1
        return this._indexToRef(nextIndex)
    }

    prevRef(ref: BibleRef) : BibleRef | null {
        const currentIndex = this._refToIndex(ref)
        const prevIndex = currentIndex - 1
        return this._indexToRef(prevIndex)
    }

    /**
     * Returns -1 if ref1 < ref2, 0 if ref1 = ref2, 1 if ref1 > ref2
     * If the references are in the same book and chapter, the verse is used to determine the order.
     */
    compareRefs(ref1: BibleRef, ref2: BibleRef) {
        const index1 = this._refToIndex(ref1)
        const index2 = this._refToIndex(ref2)
        const indexDiff = index1 - index2

        if (indexDiff !== 0)
            return indexDiff

        if (typeof ref1.verse === 'number' && typeof ref2.verse === 'number') 
            return ref1.verse - ref2.verse
        
        return 0
    }

    fuzzyMatchBook(book: string) {
        const lower = book.toLowerCase()
        for (const bookAbbv in this._bookNames) {
            if (bookAbbv.toLowerCase() === lower || this._bookNames[bookAbbv].toLowerCase() === lower) {
                return bookAbbv
            }
        }
        return null
    }

    fuzzyMatchRefByBookChapter(book: string, chapter?: number | string | null) : BibleRef | null {
        const bookAbbv = this.fuzzyMatchBook(book)
        if (!bookAbbv) {
            return null
        }
        const chapterNum = typeof chapter === 'number' ? chapter : parseInt(chapter ?? '')
        const isValidChapter = !isNaN(chapterNum) && this.isChapterNumberValid(bookAbbv, chapterNum)
        if (!isValidChapter) {
            const ref = { bookAbbv, chapter: 1 }
            return ref
        }
        const ref = { bookAbbv, chapter: chapterNum }
        return ref
    }

    listRefsForBook(bookAbbv: string) : BibleRef[] {
        const chapterCount = this._chapterCounts[bookAbbv] || 0
        const refs = []
        for (let chapter = 1; chapter <= chapterCount; chapter++) {
            refs.push({ bookAbbv, chapter })
        }
        return refs
    }
}
