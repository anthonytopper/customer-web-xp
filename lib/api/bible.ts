import type { BibleBaseLayer } from "../plan/base";
import type { CatalogPage } from "../plan/catalog";
import type { SimpleList, SimpleListSummary } from "../plan/list";
import type { SectionManifest } from "../plan/manifest";
import { apiClient } from "./client";
import type { RequestOptions } from "./client";
import type { BibleRef } from "../toc/bible";
import * as BibleRefUtils from "../toc/ref";
import { PostEventSource } from "./sse";
import { DIGIT_TO_SUPERSCRIPT } from "../util/string";

export const DEFAULT_BASE_ID = 'bible-beta-v1'


export type CommentaryWordCounts = Record<string, number>;

export interface BasicHistoryMessage {
    role: 'user' | 'ai';
    message: string;
    script?: unknown;
}

export type MonthStr =
    | '01' | '02' | '03' | '04' | '05' | '06'
    | '07' | '08' | '09' | '10' | '11' | '12';

export type DayStr =
    | '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10'
    | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20'
    | '21' | '22' | '23' | '24' | '25' | '26' | '27' | '28' | '29' | '30'
    | '31';

const envString = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim().length > 0 ? value : undefined;

// Vite only exposes env vars prefixed with `VITE_` to the browser build.
// Recommended:
// - VITE_BIBLE_API_BASE=https://...
// - VITE_BIBLE_API_KEY=...
const BASE_URL = envString(process.env.BIBLE_API_BASE);
const API_KEY = envString(process.env.BIBLE_API_KEY);

const getOptions = (opts?: { signal?: AbortSignal }): RequestOptions =>
    ({
        baseUrl: BASE_URL,
        // skip auth token to favor api key.
        // our main auth tokens won't work as they are signed to copilot and not bible api
        authToken: '',
        headers: API_KEY ? { 'X-API-KEY': API_KEY } : {},
        signal: opts?.signal,
    })

export const searchWSEndpoint = (): string => {
    const baseUrlWithoutProtocol = (BASE_URL ?? '').replace(/^https?:\/\//i, '').replace(/^wss?:\/\//i, '').replace(/\/$/, '');
    let wsUrl = 'wss://' + baseUrlWithoutProtocol + '/api/experimental/search';
    // Append API key as query parameter if available
    if (API_KEY) {
        const hasQuery = wsUrl.includes('?');
        wsUrl = wsUrl + (hasQuery ? '&' : '?') + 'api_key=' + encodeURIComponent(API_KEY);
    }
    return wsUrl;
}

export type GetForRefResponse = SectionManifest;

export const getPlanBase = async (planID: string, opts?: { signal?: AbortSignal }) => {
    const url = `api/bible_base_layer/${planID}?enriched=true`;
    console.log('PlanAPI getPlanBase', url, 'baseUrl:', BASE_URL, 'API_KEY:', API_KEY)
    return apiClient.get<BibleBaseLayer>(url, getOptions({ signal: opts?.signal }));
}

export const getBaseLayerSectionByRef = async (planID: string, ref: BibleRef | string) => {
    const baseLayer = await getPlanBase(planID);
    const section = baseLayer.sections.find(section => BibleRefUtils.refsSameChapter(section.ref, ref));
    return section;
}

export const getManifestForRef = async (planID: string, ref: string) => {
    const url = `api/bible_section_manifest/${planID}/${ref}?signed=true`;
    console.log('PlanAPI getManifestForRef', url, 'baseUrl:', BASE_URL)
    return apiClient.get<GetForRefResponse>(url, getOptions());
}

export const getManifestListForRefs = async (planID: string, refs: string[], signed = true) => {
    const queryParams = new URLSearchParams()
    refs.forEach(ref => queryParams.append('refs', ref))
    queryParams.append('signed', signed.toString())
    const url = `api/bible_section_manifest_list/${planID}?${queryParams.toString()}`;
    return apiClient.get<GetForRefResponse[]>(url, getOptions());
}

export const getCommentaryWordCounts = async () => {
    const url = `/api/commentary_word_cnts_all_chapters`;
    return apiClient.get<CommentaryWordCounts>(url, getOptions());
}

export const getPlanLists = async (planID: string) => {
    const url = `api/lists/${planID}`;
    console.log('PlanAPI getPlanLists', url, 'baseUrl:', BASE_URL)
    return apiClient.get<SimpleListSummary[]>(url, getOptions());
}

export const getPlanListByAlias = async (planID: string, listAlias: string) => {
    const url = `api/lists/${planID}/alias/${listAlias}`;
    return apiClient.get<SimpleList>(url, getOptions());
}

export interface BibleTextForRefResponse {
    verses: Record<string, string>;
}

/**
 * Converts a number to its superscript representation
 */
const numberToSuperscript = (num: number): string => {
    return num.toString().split('').map(digit => DIGIT_TO_SUPERSCRIPT[digit] || digit).join('');
};

export const getBibleTextForRef = async (ref: BibleRef | [BibleRef, BibleRef], opts?: { signal?: AbortSignal }): Promise<string> => {
    let bookAbbr: string;
    let chapterStart: number;
    let verseStart: number;
    let chapterEnd: number;
    let verseEnd: number;
    if (Array.isArray(ref)) {
        const [start, end] = ref;
        bookAbbr = start.bookAbbv;
        chapterStart = start.chapter;
        verseStart = start.verse ?? 1;
        chapterEnd = end.chapter;
        verseEnd = end.verse ?? 1;
    } else {
        bookAbbr = ref.bookAbbv;
        chapterStart = ref.chapter;
        verseStart = ref.verse ?? 1;
        chapterEnd = ref.chapter;
        verseEnd = ref.verse ?? 1;
    }
    const url = `/api/bible_text_by_verse_range/${bookAbbr}/${chapterStart}/${verseStart}/${chapterEnd}/${verseEnd}`;
    const response = await apiClient.get<BibleTextForRefResponse>(url, getOptions({ signal: opts?.signal }));
    
    // Sort verses by verse number
    const sortedVerses = Object.entries(response.verses)
        .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10));
    
    // Add superscript verse numbers as prefixes and concatenate
    return sortedVerses
        .map(([verseRefStr, verseText]) => {
            const verseStr = verseRefStr.split(':')[2];
            const verseNumber = parseInt(verseStr, 10);
            if (!verseNumber) return verseText;
            const superscriptNum = numberToSuperscript(verseNumber);
            return `${superscriptNum}${verseText}`;
        })
        .join('  ');
}

// export const getReflectionsForRef = async (refStr : string, options? : {num_questions?: number, max_length?: number}) => {
//     const queryParams = new URLSearchParams()
//     if (options?.num_questions) {
//         queryParams.set('num_questions', options.num_questions.toString())
//     }
//     if (options?.max_length) {
//         queryParams.set('max_length', options.max_length.toString())
//     }
//     const url = `api/reflections_from_ref/${refStr}?${queryParams.toString()}`;
//     return apiClient.get<Omit<ReflectionPromptSet, 'ref'>>(url, getOptions());
// }

// export type EntrypointResp = EntrypointSet[];
// export type ReflectionPromptResp = ReflectionPromptSet[];
// export type ScriptResp = ScriptSet[];

// export type JSONResponseType = 'entrypoints' | 'reflections' | 'scripts';
// export type JSONResponseForType<T> = T extends 'entrypoints' ? EntrypointResp : T extends 'reflections' ? ReflectionPromptResp : T extends 'scripts' ? ScriptResp : never;

// In-flight request de-duplication to coalesce concurrent identical fetches
// const inflightJSONRequests = new Map<string, Promise<unknown>>();
// export const getJSON = async <T extends JSONResponseType>(url: string) => {
//     if (import.meta.env.DEV) {
//         console.log('PlanAPI getJSON', url, 'baseUrl:', BASE_URL)
//     }
//     if (inflightJSONRequests.has(url)) {
//         return inflightJSONRequests.get(url) as Promise<JSONResponseForType<T>>;
//     }
//     const request = (async () => {
//         try {
//             const response = await fetch(url, { headers: { 'X-API-KEY': API_KEY ?? '' } })
//             if (import.meta.env.DEV) {
//                 console.log('PlanAPI getJSON status', response.status)
//             }
//             if (!response.ok) {
//                 const text = await response.text().catch(() => '')
//                 console.error('PlanAPI getJSON not ok', { status: response.status, text: text?.slice(0, 200) })
//                 throw new Error(`PlanAPI getJSON failed: ${response.status}`)
//             }
//             const json = await response.json()
//             if (import.meta.env.DEV) {
//                 console.log('PlanAPI getJSON parsed ok')
//             }
//             return json as JSONResponseForType<T>
//         } catch (err) {
//             console.error('PlanAPI getJSON error', err)
//             throw err
//         } finally {
//             inflightJSONRequests.delete(url)
//         }
//     })();
//     inflightJSONRequests.set(url, request);
//     return request;
// }

// export const getJSONForItemOfType = async <T extends JSONResponseType> (sectionManifest: SectionManifest, itemType: T) => {
//     const items = sectionManifest.items.filter(item => item.type === itemType)
//     const downloadURL = items[0]?.paths_signed?.json
//     if (!downloadURL) return null
//     return getJSON<T>(downloadURL)
// }

export const getAllCatalogPages = async () => {
    const url = `api/catalog-pages`;
    return apiClient.get<CatalogPage[]>(url, getOptions());
}

export const getCatalogPageByAlias = async (alias: string) => {
    const url = `api/catalog-pages/${alias}`;
    return apiClient.get<CatalogPage>(url, getOptions());
}

// interface ChatScriptStreamingRequestMessage {
//     role: 'user' | 'ai';
//     message: string;
// }
// interface ChatScriptStreamingRequest {
//     ref?: string;
//     user_input: string;
//     highlight_text?: string;
//     message_history: ChatScriptStreamingRequestMessage[];
// }
// export interface ChatScriptStreamingParams {
//     refStr?: string;
//     userInput: string;
//     highlightText?: string;
//     messageHistory: BasicHistoryMessage[];
// }
// export const chatScriptStream = async (
//     params: ChatScriptStreamingParams,
//     opts: {
//         onMessages?: (messages: SSCMessage[]) => void;
//         onDone?: () => void;
//         onError?: (err: unknown) => void;
//         signal?: AbortSignal;
//     } = {}
// ) => {
//     try {
//         const url = `/api/chat_script_streaming?llm_patch=gpt-5.1`;
//         const payload: ChatScriptStreamingRequest = {
//             ref: params.refStr,
//             user_input: params.userInput,
//             highlight_text: params.highlightText,
//             message_history: params.messageHistory.map(message => ({
//                 role: message.role,
//                 message: message.role === 'user' ? message.message : (JSON.stringify(message.script) ?? ''),
//             })),
//         }

//         let buffer = '';

//         const ret = await apiClient.streamPlainText(
//             HttpMethod.POST,
//             url,
//             payload,
//             {
//                 ...getOptions(),
//                 signal: opts.signal,
//                 onOpen: () => {
//                     buffer = '';
//                 },
//                 onChunk: (chunk) => {
//                     // Accumulate and emit complete SSC frames separated by double newlines
//                     buffer += chunk;
//                     // If CRLF is used, normalize to \n first
//                     if (buffer.includes('\r\n')) {
//                         buffer = buffer.replace(/\r\n/g, '\n');
//                     }
//                     const parsed = consumeSSCFrames(buffer);
//                     buffer = parsed.rest;
//                     const messages = parsed.messages;

//                     if (messages.length) {
//                         opts.onMessages?.(messages);
//                     }
//                 },
//                 onDone: () => {
//                     // Flush any trailing frame without separator
//                     const trimmed = buffer.trim();
//                     if (trimmed.length > 0) {
//                         const messages = parseSSCFrame(trimmed);
//                         if (messages.length) opts.onMessages?.(messages);
//                     }
//                     opts.onDone?.();
//                 },
//                 onError: (err) => {
//                     console.error('ChatScriptStreaming error', err)
//                     opts.onError?.(err);
//                 }
//             }
//         );

//         return ret;

//     } catch (err) {
//         console.error('ChatScriptStreaming error', err)
//         opts.onError?.(err)
//     }

//     return { close: () => {} };
// }

export interface GlobalEPQ {
    list_id: number;
    list_name: string;
    question_number: number;
    question: string;
}
export interface GlobalEPQsResponse {
    questions: GlobalEPQ[];
    total_available: number;
    }
export const getGlobalEPQs = async (count = 3) => {
    const url = `api/global-epqs?count=${count}`;
    return apiClient.get<GlobalEPQsResponse>(url, getOptions());
}


export type DailyVerseSelectorDate = `${MonthStr}-${DayStr}`;
export type DailyVerseSelector = 'today' | DailyVerseSelectorDate;
export interface DailyVerseResponse {
    verse: DailyVerse;
}
export interface DailyVerse {
    date: DailyVerseSelectorDate;

    /**
     * The standard complete Bible reference for the verse.
     * Example: "Matt:6:33-6:33"
     */
    reference_standard: string;

    /**
     * The text of the verse in the ASV translation.
     * Example: "But seek ye first his kingdom, and his righteousness; and all these things shall be added unto you."
     */
    text_asv: string;

    /**
     * The insights provided by the rebinder.
     */
    rebinderInsights?: string;

    /**
     * The name of the rebinder who provided the insights.
     */
    rebinderName?: string;
}
// Args: verse_date: Date in YYYY-MM-DD or MM-DD format. 
// The year is ignored. February 29th (02-29) is mapped to January 1st (01-01) 
// since the collection has 365 verses (non-leap year).
export const getDailyVerse = async (selector: DailyVerseSelector = 'today', opts?: { signal?: AbortSignal }) => {
    const url = `api/daily-verses/${selector}`;
    return apiClient.get<DailyVerseResponse>(url, getOptions({ signal: opts?.signal }));
}


export interface RebinderDetails {
    name: string;
    gender: string;

    // Extended
    series: 'NICNT' | 'NICOT';
    bookAbbrs: string[]
    bookNames: string[]
    institutions: string[];
    biography: string;
}
/**
 * Fetch rebinder data for the given names.
 * @param names - Array of names to query.
 * @param extended - Whether to request extended data (default: true).
 */
export const getRebinderData = async (names: string[]) => {
    const queryParams = new URLSearchParams()
    names.forEach(name => queryParams.append('names', name))
    queryParams.append('extended', 'true')
    const url = `api/rebinder_data/${DEFAULT_BASE_ID}?${queryParams.toString()}`;
    return apiClient.get<RebinderDetails[]>(url, getOptions());
}

export const getRebinderNames = async (refString: string) => {
    const url = `api/rebinder_names/${refString}`;
    return apiClient.get<string[]>(url, getOptions());
}

export interface SourcedChatMessageHistory {
    role: 'user' | 'ai';
    message: string;
}

export interface SourcedChatStreamingParams {
    ref: string[];
    user_input: string;
    highlight_text?: string;
    message_history: SourcedChatMessageHistory[];
    special_rules: string[];
    user_info: string[];
}
export const sourcedChatStream = async (
    payload: SourcedChatStreamingParams
) => {
    // Call our backend API endpoint which handles the Bible API connection
    const url = `/api/chat/sourced`;
    const eventSource = new PostEventSource(url, payload, {});
    return { eventSource };
}

export interface ChatTitleRequest {
    message_history: SourcedChatMessageHistory[];
}

export interface ChatTitleResponse {
    title: string;
}

export const getChatTitle = async (
    messageHistory: SourcedChatMessageHistory[],
    opts?: { signal?: AbortSignal }
): Promise<ChatTitleResponse> => {
    // Call our backend API endpoint which handles the Bible API connection
    const url = `/api/chat/title`;
    const payload: ChatTitleRequest = {
        message_history: messageHistory,
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: opts?.signal,
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Chat title request failed: ${response.status} ${response.statusText}${errorText ? ` — ${errorText.slice(0, 300)}` : ''}`);
    }

    return response.json() as Promise<ChatTitleResponse>;
}

export interface ChatTool {
    name: string;
    version: string;
    label: string;
    description: string;
    rules: string[];
    id: string;
}

export const getChatTools = async (opts?: { signal?: AbortSignal }): Promise<ChatTool[]> => {
    // Call our Next.js API route which proxies to Bible API
    // This ensures the route works locally and hits bible-api's /api/chat-tools endpoint
    const url = `/api/chat-tools`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
        signal: opts?.signal,
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Chat tools request failed: ${response.status} ${response.statusText}${errorText ? ` — ${errorText.slice(0, 300)}` : ''}`);
    }

    return response.json() as Promise<ChatTool[]>;
}