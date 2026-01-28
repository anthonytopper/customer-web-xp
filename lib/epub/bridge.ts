import { EventListener } from "@/lib/event/listener";
import { CFI } from "../cfi/helper";
import { CFISelectorDOM } from "../cfi/selector";
import { FullAddress, getOffset, toNodeAddress } from "../cfi/utils";
import { CFIViewLineHeight } from "../cfi/display";
import { CFIHighlightsManagerSVG, HighlightParams } from "../cfi/highlights";

export interface EpubBridgeEventLoad {
    name: 'load';
}
export interface EpubBridgeEventSelect {
    name: 'select';
    cfi?: string;
    text?: string;
}

export interface EpubBridgeHighlight {
    id: string;
    cfi: string;
    color: string;
}

export type EpubBridgeEvent = 
    | EpubBridgeEventLoad 
    | EpubBridgeEventSelect;

const THEME_STYLE_TAG_ID = 'theme-style-tag';

export class EpubBridgeIframe {

    protected _setupHeaders() {
        const doc = this._iframe.contentDocument;
        if (!doc)
            return;
        const head = doc.head;
        if (!head)
            return;
        const meta = doc.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=0.99, user-scalable=0';
        head.appendChild(meta);

        const styleOverride = doc.createElement('style');
        styleOverride.textContent = `
            .heading {
                display: none;
            }
        `;
        head.appendChild(styleOverride);
    }

    protected _setupListeners() {
        const doc = this._iframe.contentDocument;
        if (!doc) return;
        doc.addEventListener('selectionchange', this._handleSelectionEvent);
    }

    protected _handleSelectionEvent = () => {
        const selection = this._iframe.contentDocument?.defaultView?.getSelection()
        if (!selection || selection.rangeCount === 0)
            return // this._onSelectionCallback?.();
        const range = selection?.getRangeAt(0);
        if (!range)
            return // this._onSelectionCallback?.();
        const text = range.toString();
        const selector = this._getBodySelector();
        if (!selector)
            return;
        const [start, end] = selector.fromDOMRange(range);
        const startCfi = this._buildBodyCFI(start);
        const endCfi = this._buildBodyCFI(end);
        const rangeCfi = CFI.fromRange(startCfi, endCfi)?.toString();
        this.events.publish({ name: 'select', cfi: rangeCfi, text });
    }

    private _getBody(): HTMLElement | null {
        const body = this._iframe.contentDocument?.body;
        if (!body)
            return null;
        return body;
    }

    protected _getBodySelector() {
        const body = this._getBody();
        if (!body)
            return null;
        return new CFISelectorDOM(body);
    }

    protected _getView() {
        const body = this._getBody();
        const selector = this._getBodySelector();

        if (!body || !selector)
            return null;
        
        const doc = this._iframe.contentDocument;
        if (!doc)
            return null;

        const window = this._iframe.contentWindow;
        if (!window)
            return null;

        const view = new CFIViewLineHeight(doc, window, selector);
        return view
    }

    protected _buildBodyCFI(address: FullAddress) {
        const spineIndex = this._spineIndex;
        const steps = toNodeAddress(address);
        const offset = getOffset(address) ?? undefined;
        steps.unshift(4);
        return CFI.build({ spineIndex, opfIndex: 6, steps, offset }).toString();
    }

    events = new EventListener<EpubBridgeEvent>();

    constructor(iframe: HTMLIFrameElement, spineIndex: number) {
        this._iframe = iframe;
        this._spineIndex = (spineIndex + 1) * 2;
    }

    private _iframe: HTMLIFrameElement;
    private _spineIndex: number;
    private _highlightsManager?: CFIHighlightsManagerSVG;
    get iframe() {
        return this._iframe;
    }

    setTheme(theme: 'light' | 'dark') {
        console.log('setTheme', theme);
        const doc = this._iframe.contentDocument;
        if (!doc)
            return;
        const themeStyleTag = doc.getElementById(THEME_STYLE_TAG_ID);
        if (themeStyleTag) {
            themeStyleTag.remove();
        }
        const newThemeStyleTag = doc.createElement('style');
        newThemeStyleTag.id = THEME_STYLE_TAG_ID;
        newThemeStyleTag.textContent = `
            p {
                color: ${theme === 'dark' ? '#BBBEBB' : '#000'};
            }
        `;
        doc.head.appendChild(newThemeStyleTag);
    }

    load() {
        this._setupListeners();
        this._setupHeaders();
        const view = this._getView();
        if (view)
            this._highlightsManager = new CFIHighlightsManagerSVG(view);

        this.events.publish({ name: 'load' });
    }

    setHighlights(highlights: EpubBridgeHighlight[]) {
        const view = this._getView()
        if (!view)
            return;

        this._highlightsManager?.removeAll();
        for (const highlight of highlights) {
            const cfi = CFI.fromString(highlight.cfi);
            if (cfi.spineIndex !== this._spineIndex)
                continue;

            const [startAddr, endAddr] = cfi.toSelectorAddressRange()

            this._highlightsManager?.add({
                id: highlight.id,
                startAddr,
                endAddr,
                color: highlight.color,
            });
        }
    }


}
