
export interface BibleBaseLayerSection {
    id: string
    ref: string
    title: string
    group: string
    group_idx: number
    is_enabled: boolean
    duration_sec?: number
    book_image_url? : string
    default_image_url? : string
}


export interface BibleBaseLayer {
    id: string
    name: string
    description: string
    section_count: number
    sections: BibleBaseLayerSection[]
    enrichment_timestamp? : string
    alt2primary? : boolean
}


