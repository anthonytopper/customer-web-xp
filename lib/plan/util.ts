/**
 * File: services/plan/util.ts
 *
 * Overview:
 * - Service module encapsulating business logic, side effects, or integrations. Exports: recastFromSectionManifest, recastManifestFromPlanItem, trackForRecast, getItemForBibleRef, generateBibleChapterCounts, ...
 *
 * Dependencies:
 * - ../../assets/images/bible-icon-2.png
 * - ../store/recast
 * - ../toc/bible
 * - ../toc/ref
 * - ./base
 * - ./item
 * - ./list
 * - ./manifest
 * - ./recast
 * - react-native
 *
 * Architectural Notes:
 * - Plan domain: catalog, progress, and script execution. Keep calculation logic deterministic.
 *
 * Auto-generated header (2025-10-24). Review and refine as needed.
 */
import { BibleBookNameMap, BibleChapterCountMap, BibleRef, BibleTOC } from "../toc/bible";
import * as BibleRefUtils from "../toc/ref";
import { BibleBaseLayer } from "./base";
import { PlanItem } from "./item";
import { ChapterOnlyList } from "./list";
import { SectionManifest } from "./manifest";
import { RecastManifest } from "@/lib/plan/recast";


export const recastFromSectionManifest = (sectionManifest: SectionManifest) : RecastManifest | null => {
    // Prefer the canonical 'full-overview' item, but gracefully fall back to the first item
    // so the UI can render title/meta/artwork even if content types evolve.
    const item = sectionManifest.items.find(it => it.type === 'full-overview') ?? sectionManifest.items[0]
    if (!item)
        return null

    return {
        ...item,
        sectionId: sectionManifest.id,
        default_image_url: sectionManifest.default_image_url,
        book_image_url: sectionManifest.book_image_url,
        ref: BibleRefUtils.parseRefStringChapter(sectionManifest.ref),
        updatedAt: sectionManifest.updatedAt
    }
}

export const recastManifestFromPlanItem = (item: PlanItem, sectionManifest: SectionManifest) : RecastManifest => 
    ({
        ...item,
        sectionId: sectionManifest.id,
        default_image_url: sectionManifest.default_image_url,
        book_image_url: sectionManifest.book_image_url,
        ref: BibleRefUtils.parseRefStringChapter(sectionManifest.ref),
        updatedAt: sectionManifest.updatedAt
    })


export const getItemForBibleRef = (plan: BibleBaseLayer, ref: BibleRef) => {
    for (const section of plan.sections) {
        const {bookAbbv, chapter} = BibleRefUtils.parseRefStringChapter(section.ref)
        if (bookAbbv === ref.bookAbbv && chapter === ref.chapter) {
            return section
        }
    }
    return null
}

export const generateBibleChapterCounts = (plan: BibleBaseLayer) : BibleChapterCountMap => {
    const counts : BibleChapterCountMap = {}
    for (const section of plan.sections) {
        const {bookAbbv} = BibleRefUtils.parseRefStringChapter(section.ref)
        counts[bookAbbv] = (counts[bookAbbv] ?? 0) + 1
    }
    return counts
}

export const generateBibleBookNames = (plan: BibleBaseLayer) : BibleBookNameMap => {
    const names : BibleBookNameMap = {}
    for (const section of plan.sections) {
        const {bookAbbv} = BibleRefUtils.parseRefStringChapter(section.ref)
        names[bookAbbv] = section.group
    }
    return names
}

export const getBibleBookName = (plan: BibleBaseLayer, matchBookAbbv: string) : string | null => {
    for (const section of plan.sections) {
        const {bookAbbv} = BibleRefUtils.parseRefStringChapter(section.ref)
        if (bookAbbv === matchBookAbbv) {
            return section.group
        }
    }
    return null
}

export const getBookNamesForLists = (lists: ChapterOnlyList[], toc?: BibleTOC) : string[] => {
    const seen: string[] = []
    lists.forEach((l) => {
        l.items?.forEach((it) => {
            const parsed = BibleRefUtils.parseRefStringChapter(it.ref)
            const bookAbbv = parsed.bookAbbv
            const bookName = toc?.getBookName(bookAbbv) ?? bookAbbv
            if (!seen.includes(bookName)) seen.push(bookName)
        })
    })
    return seen
}

export const getTOCForBaseLayer = (baseLayer: BibleBaseLayer) : BibleTOC => {
    return new BibleTOC(generateBibleChapterCounts(baseLayer), generateBibleBookNames(baseLayer));
}
