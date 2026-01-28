/**
 * File: services/conversations/entrypoint.ts
 *
 * Overview:
 * - Service module encapsulating business logic, side effects, or integrations. Exports: (analyze manually)
 *
 * Dependencies:
 * - (none detected)
 *
 * Architectural Notes:
 * - Module-level guidance should be added here based on this file's role.
 *
 * Auto-generated header (2025-10-24). Review and refine as needed.
 */
export interface EntrypointBase {
    prompt: string
}

export interface EntrypointRemote extends EntrypointBase {
    type : 'remote'
    rebind_chunk_id: string;
    version: string;
}

export interface EntrypointStatic extends EntrypointBase {
    type : 'static'
    id : string
}

export interface EntrypointPlain extends EntrypointBase {
    type : 'plain'
}

export type Entrypoint = 
    | EntrypointRemote 
    | EntrypointStatic 
    | EntrypointPlain

