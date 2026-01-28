import { Event, EventListener } from "@/lib/event/listener";
import { CFIView } from "./display";
import { LongPressHandler, ShortPressHandler } from "./domevent";
import { CFIHighlightsManager, CFIHighlightsManagerRects } from "./highlights";
import { Place, Selection, TextSelectionInteraction } from "./interact";
import { RendererPlugin, RendererPluginSetup } from "./render";
import { CFISelectionUtils, CFISelector } from "./selector";
import { isDefined } from "./util";


export interface VerseRef {
    refStr : string;
    verseNumber : number;
}


export class BibleVerseSelector {
    constructor(private _selector: CFISelector) {}

    private get _nodeImpl() {
        return this._selector.getNodeImpl();
    }

    private _findRefElements(node : Node) {
        if (this._nodeImpl.getNodeType(node) !== 'element')
            return [];
        const element = node as Element;
        if (this._nodeImpl.getAttribute(node, 'data-osisref')) {
            return [element];
        }
        const children = Array.from(element.childNodes)
        const refElementsFromChildren : Element[] = [];
        for (const child of children) {
            const found = this._findRefElements(child as Element)
            refElementsFromChildren.push(...found);
        }
        return refElementsFromChildren;
    }

    private _refElementsForNode(node : Node) : Element[] {
        if (this._nodeImpl.getNodeType(node) !== 'element') {
            const parent = node.parentNode;
            if (!parent)
                return [];
            return this._refElementsForNode(node.parentNode);
        }
        const refElements = this._findRefElements(node as Element);
        if (refElements.length === 0) {
            const parent = node.parentNode;
            if (!parent)
                return [];
            return this._refElementsForNode(parent);
        }
        return refElements;
    }

    private _isNodeBefore(node : Node, other : Node) {
        return this._nodeImpl.isBefore(node, other);
    }

    private _isNodeAfter(node : Node, other : Node) {
        return this._nodeImpl.isAfter(node, other);
    }

    private _findFirstNodeBefore<N extends Node>(node : Node, list : N[]) {
        const reversed = list.reverse();
        for (const item of reversed) {
            const itemBeforeNode = this._isNodeBefore(item, node);
            if (itemBeforeNode)
                return item;
        }
        return null;
    }

    private _findFirstNodeAfter<N extends Node>(node : Node, list : N[]) {
        for (const item of list) {
            const itemAfterNode = this._isNodeAfter(item, node);
            if (itemAfterNode)
                return item;
        }
        return null;
    }

    private _refElementForNode(node : Node) {
        if (!node)
            return null;
        const refs = this._refElementsForNode(node as Element);
        if (refs.length === 0)
            return null;

        if (refs.length === 1)
            return refs[0];


        const firstBefore = this._findFirstNodeBefore(node, refs);
        if (firstBefore)
            return firstBefore;

        const firstAfter = this._findFirstNodeAfter(node, refs);
        if (firstAfter)
            return firstAfter;

        return null;
    }

    private _refFromRefElement(element : Element) : VerseRef | null {
        const refStr = this._nodeImpl.getAttribute(element, 'data-osisref');
        if (!refStr)
            return null;
        const verseStr = refStr.split('.').pop()
        if (!verseStr)
            return null;
        const verseNumber = parseInt(verseStr);
        return {
            verseNumber,
            refStr
        };
    }

    private _allRefElements() {
        const body = this._selector.getRoot();
        if (this._nodeImpl.getNodeType(body) !== 'element')
            return [];
        const refs = this._findRefElements(body as Element);
        return refs;
    }

    refFromAddr(addr: CFISelectionUtils.FullAddress) : VerseRef | null {
        const nodeAddr = CFISelectionUtils.toNodeAddress(addr);
        const node = this._selector.nodeFromAddress(nodeAddr);
        if (!node)
            return null;
        const refElement = this._refElementForNode(node);
        if (!refElement)
            return null;
        return this._refFromRefElement(refElement);
    }

    addrRangeFromVerseNumber(verseNumber : number) : [CFISelectionUtils.FullAddress, CFISelectionUtils.FullAddress] | null {
        const refElements = this._allRefElements();
        console.log('[BibleVerseSelector] addrRangeFromVerseNumber 1', verseNumber, refElements);
        for (let i = 0; i < refElements.length; i++) {
            const refElement = refElements[i];
            const ref = this._refFromRefElement(refElement);
            if (!ref)
                continue;
            console.log('[BibleVerseSelector] addrRangeFromVerseNumber 2', verseNumber, refElement, ref.verseNumber);
            if (ref.verseNumber === verseNumber) {
                const startAddr = this._selector.addressFromNode(refElement);
                const nextRef = refElements[i + 1];
                const endAddr = nextRef ? this._selector.addressFromNode(nextRef) : this._selector.getEndAddress();
                console.log('[BibleVerseSelector] addrRangeFromVerseNumber 3', verseNumber, refElement, startAddr, endAddr);
                return [[...startAddr, ':0'], [...endAddr, ':0']];
            }
        }
        return null;
    }

    extractVerse(verseNumber : number) {
        const addrRange = this.addrRangeFromVerseNumber(verseNumber)
        if (!addrRange)
            return null;
        const [startAddr, endAddr] = addrRange;
        return this._selector.extractTextRange(startAddr, endAddr);
    }

    extractVerseRange(startVerseNumber? : number, endVerseNumber? : number) {
        const addrRangeStart = startVerseNumber ? this.addrRangeFromVerseNumber(startVerseNumber) : null;
        const addrRangeEnd = endVerseNumber ? this.addrRangeFromVerseNumber(endVerseNumber) : null;
        const [startAddr] = addrRangeStart ?? [];
        const [, endAddr] = addrRangeEnd ?? [];
        return this._selector.extractTextRange(startAddr, endAddr);
    }

    inViewVerseRange(window: Window) : [number, number] | null {
        const windowHeight = window.innerHeight;
        const allRefElements = this._allRefElements();
        let startVerseNumber : number | null = null;
        let endVerseNumber : number | null = null;
        let currentVerseNumber : number | null = null;

        for (const refElement of allRefElements) {
            const rect = refElement.getBoundingClientRect();
            const isInView = rect.y + rect.height >= 0 && rect.y <= windowHeight;

            // Have not found a verse in view yet
            if (!isInView && !startVerseNumber)
                continue;

            const ref = this._refFromRefElement(refElement)
            if (!ref)
                continue;

            currentVerseNumber = ref.verseNumber;

            // Have found a verse in view and are still looking for the end verse
            if (isInView && startVerseNumber)
                continue;

            // Have found the first verse in view which is the start verse
            if (isInView && !startVerseNumber) {
                startVerseNumber = currentVerseNumber;
                continue;
            }

            // Already started and now found the end verse
            if (!isInView && startVerseNumber) {
                endVerseNumber = currentVerseNumber - 1;
                break
            }
        }

        if (startVerseNumber && endVerseNumber)
            return [startVerseNumber, endVerseNumber];
        if (startVerseNumber && currentVerseNumber)
            return [startVerseNumber, currentVerseNumber];
        
        return null;
    }

    inDocVerseRange() : [number, number] | null {
        const allRefElements = this._allRefElements();
        const allVerseNumbers = allRefElements
            .map(refElement => this._refFromRefElement(refElement)?.verseNumber)
            .filter(isDefined);
        if (allVerseNumbers.length === 0)
            return null;
        return [Math.min(...allVerseNumbers), Math.max(...allVerseNumbers)];
    }

}

export interface VerseSelectionEvent extends Event {
    name: 'verse-select';
    verseNumbers?: [number, number];
}

export class BibleVerseHighlighter extends TextSelectionInteraction {


    constructor(
        protected _selector: CFISelector, 
        protected _view: CFIView, 
        protected _highlightManager: CFIHighlightsManager, 
        protected _verseSelector: BibleVerseSelector
    ) {
        super(_selector, _view, _highlightManager);
        this._longPressHandler = new LongPressHandler(this._document);
        this._shortPressHandler = new ShortPressHandler(this._document);
    }

    verseEvents = new EventListener<VerseSelectionEvent>();
    private _longPressHandler: LongPressHandler;
    private _shortPressHandler: ShortPressHandler;

    protected _cursorAddressForLocation(place: Place, location: {x: number, y: number}) : CFISelectionUtils.FullAddress | null {
        const addr = this._selectionForLocation(location);
        if (!addr)
            return null;
        if (place === 'start') {
            return addr[0];
        }
        return addr[1];
    }

    protected _handleClick = (e: MouseEvent) => {
        // const point = {x: e.clientX, y: e.clientY};
        // const addrRange = this._selectionForLocation(point);
        // if (!addrRange)
        // console.console.log('[BibleVerseHighlighter] handleClick');
        // return this._clearSelection();
        // Click will ONLY clear selection
        // this._initSelection(addrRange);
        
        const point = {x: e.clientX, y: e.clientY};

        if (this._selection) {
            return this._clearSelection();
        }
        const addrRange = this._selectionForLocation(point);
        if (!addrRange)
            return
        this._initSelection(addrRange);
    }

    protected _handleLongPress = (point: {x: number, y: number}) => {
        // const addrRange = this._selectionForLocation(point);
        // if (!addrRange)
        //     return
        // this._initSelection(addrRange);
    }

    protected _handleShortPress = (point: {x: number, y: number}) => {
        // const addrRange = this._selectionForLocation(point);
        // if (!addrRange)
        //     return
        // this._initSelection(addrRange);
    }

    protected _selectionForLocation(point: {x: number, y: number}) : Selection | null {
        const addr = this._view.addressForClientPoint(point);
        console.log('[BibleVerseHighlighter] _selectionForLocation 1', point, addr);
        if (!addr)
            return null;
        const ref = this._verseSelector.refFromAddr(addr);
        console.log('[BibleVerseHighlighter] _selectionForLocation 2', point, addr, ref);
        if (!ref)
            return null;
        const addrRange = this._verseSelector.addrRangeFromVerseNumber(ref.verseNumber);
        console.log('[BibleVerseHighlighter] _selectionForLocation 3', point, addr, ref, addrRange);
        return addrRange;
    }


    private _verseNumbersFromSelection() {
        if (!this._selection)
            return [];
        const startVerseNumber = this._verseSelector.refFromAddr(this._selection[0])?.verseNumber;
        const endVerseNumber = this._verseSelector.refFromAddr(this._selection[1])?.verseNumber;
        if (!startVerseNumber || !endVerseNumber)
            return [];
        return Array.from({length: endVerseNumber - startVerseNumber + 1}, (_, i) => startVerseNumber + i);
    }

    protected get _startVerseNumber() {
        const selection = this._newSelection ?? this._selection;
        if (!selection)
            return null;
        const startAddr = selection[0];
        if (!startAddr)
            return null;
        return this._verseSelector.refFromAddr(startAddr)?.verseNumber;
    }

    protected get _endVerseNumber() {
        const selection = this._newSelection ?? this._selection;
        if (!selection)
            return null;
        const endAddr = selection[1];
        if (!endAddr)
            return null;
        return this._verseSelector.refFromAddr(endAddr)?.verseNumber;
    }

    protected _sync({state}: {state: 'done' | 'update'}) {
        super._sync({state});

        const startVerseNumber = this._startVerseNumber;
        const endVerseNumber = this._endVerseNumber;

        if (!startVerseNumber || !endVerseNumber)
            return;
        this.verseEvents.publish({
            name: 'verse-select',
            verseNumbers: [startVerseNumber, startVerseNumber !== endVerseNumber ? endVerseNumber - 1 : endVerseNumber],
        });
    }

    handleClick(e: MouseEvent) {
        this._handleClick(e);
    }

    clearSelection(sendEvent: boolean = true) {
        this._clearSelection(sendEvent);
    }

    setup() {
        super.setup();
        // this._document.addEventListener('click', this._handleClick);
        // this._longPressHandler.onLongPress(this._handleLongPress);
        // this._longPressHandler.setup();
        // this._shortPressHandler.onShortPress(this._handleShortPress);
        // this._shortPressHandler.setup();
    }

    destroy() {
        // this._document.removeEventListener('click', this._handleClick);
        // this._longPressHandler?.destroy();
        // this._shortPressHandler?.destroy();
        super.destroy();
    }
    
    
}

// export class BibleVerseRendererPlugin implements RendererPlugin {
//     private _verseHighlighter?: BibleVerseHighlighter;

//     setup(options: RendererPluginSetup) {
//         const verseSelector = new BibleVerseSelector(options.bodySelector);
//         const highlightsManager = new CFIHighlightsManager(options.view, {className : '__verse_highlight__'});
//         const verseHighlighter = new BibleVerseHighlighter(options.bodySelector, options.view, highlightsManager, verseSelector);
//         verseHighlighter.setup();
//         this._verseHighlighter = verseHighlighter;
//     }

//     destroy() {
//         this._verseHighlighter?.destroy();
//     }
// }


export class BibleVerseRendererPlugin implements RendererPlugin {
    private _verseHighlighter?: BibleVerseHighlighter;

    verseEvents = new EventListener<VerseSelectionEvent>();

    private _verseEventListener = (event: VerseSelectionEvent) => {
        this.verseEvents.publish(event);
    }

    private _handleClick = (e: MouseEvent) => {
        this._verseHighlighter?.handleClick(e);
    }

    setup(options: RendererPluginSetup) {
        const verseSelector = new BibleVerseSelector(options.bodySelector);
        const highlightsManager = new CFIHighlightsManagerRects(options.view, {className : '__verse_highlight__'});
        const verseHighlighter = new BibleVerseHighlighter(options.bodySelector, options.view, highlightsManager, verseSelector);
        verseHighlighter.setup();
        this._verseHighlighter = verseHighlighter;
        verseHighlighter.verseEvents.subscribe(this._verseEventListener);
        options.document.addEventListener('click', this._handleClick);
    }

    destroy() {
        this._verseHighlighter?.destroy();
        this._verseHighlighter?.verseEvents.unsubscribe(this._verseEventListener);
    }
}