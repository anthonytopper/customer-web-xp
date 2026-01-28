
import type { PlanItem } from "./item"

export interface SectionManifest {
    etag : string
    updatedAt : string
    id : string
    title : string
    ref : string
    is_enabled: boolean
    default_image_url?: string
    book_image_url?: string
    items : PlanItem[]
}
