/**
 * File: services/plan/recast.ts
 *
 * Overview:
 * - Service module encapsulating business logic, side effects, or integrations. Exports: isRecastTrack
 *
 * Dependencies:
 * - ../toc/bible
 * - ./item
 * - ./manifest
 * - react-native-track-player
 *
 * Architectural Notes:
 * - Plan domain: catalog, progress, and script execution. Keep calculation logic deterministic.
 *
 * Auto-generated header (2025-10-24). Review and refine as needed.
 */
import { BibleRef } from "../toc/bible";
import { PlanItem } from "./item";
import { SectionManifest } from "./manifest";

type ImageUrls = Pick<SectionManifest, 'default_image_url' | 'book_image_url'>
export interface RecastManifest extends PlanItem, ImageUrls {
    ref : BibleRef
    refPretty? : string
    updatedAt: string
    /**
     * Base-layer section id that this recast belongs to.
     * This is distinct from the underlying PlanItem `id` (content item id).
     */
    sectionId?: string
}

