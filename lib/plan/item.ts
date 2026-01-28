
export interface PlanItemPaths {
    html?: string;
    audio?: string;
    timing?: string;
    json?: string;
}

export type PlanItemType = 
   | 'full-overview' 
   | 'reflections'
   | 'entrypoints'
   | 'scripts'

export interface PlanItem {
    id: string;
    type: PlanItemType;
    title: string;
    description: string;
    paths: PlanItemPaths;
    paths_signed?: PlanItemPaths;
    durationSec: number;
    rebinder: string;
}

