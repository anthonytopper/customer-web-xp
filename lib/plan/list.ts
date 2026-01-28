
export type SimpleListType = 
    | "chapter-only" 
    | "group" 
    | "bundle"

export interface SimpleListItem {
    sectionId: string;
    title: string;
    ref: string;
    order: number;
    sectionTitle: string;
    fulltextDuration: number;
    fulltextDuration_alt: number;
}

export interface BundleItem {
    groupId: string;
    groupName: string;
    order: number;
    id: string; // legacy field retained for compatibility
    name: string; // legacy field retained for compatibility
    description: string; // legacy field retained for compatibility
    items: SimpleListItem[];
}

export interface GroupItem {
    listId: string;
    listName: string;
    order: number;
    id: string; // legacy field retained for compatibility
    name: string; // legacy field retained for compatibility
    description: string; // legacy field retained for compatibility
    items: SimpleListItem[];
}

export interface SimpleListBase {
    id: string;
    userId: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    isEnabled: boolean;
    locationDescription: string;
    alias: string;
    listType: SimpleListType;
    default_image_url: string;
    is_premium?: boolean;
}

export interface BundleList extends SimpleListBase {
    listType: "bundle";
    bundleItems: BundleItem[];
    items: SimpleListItem[]; // computed/flattened items
    itemCount: number; // computed
}

export interface GroupList extends SimpleListBase {
    listType: "group";
    groupItems: GroupItem[];
    itemCount: number; // computed
}

export interface ChapterOnlyList extends SimpleListBase {
    listType: "chapter-only";
    items: SimpleListItem[];
    itemCount: number; // computed
}

export type SimpleList = BundleList | GroupList | ChapterOnlyList;

export interface SimpleListSummary {
    id: string;
    name: string;
    alias: string;
    description: string;
    isEnabled: boolean;
    itemCount: number;
    s3Key: string;
    listType: SimpleListType;
}