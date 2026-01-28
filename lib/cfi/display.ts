import * as CFISelectionUtils from "./utils";
import { CFISelector, CFISelectorDOM } from "./selector";


export type Rect = Pick<DOMRect, 'x'|'y'|'width'|'height'>

export const NULL_RECT = { x: 0, y: 0, width: 0, height: 0 };

export const rectsOverlap = (rect1: Rect, rect2: Rect) => 
    // rect1 is to the left of rect2
    rect1.x < rect2.x + rect2.width &&
    // rect1 is to the right of rect2
    rect1.x + rect1.width > rect2.x &&
    // rect1 is above rect2
    rect1.y < rect2.y + rect2.height &&
    // rect1 is below rect2
    rect1.y + rect1.height > rect2.y

// inner is completely within container
export const rectContains = (container: Rect, inner: Rect) => 
    inner.x >= container.x &&
    inner.y >= container.y &&
    inner.x + inner.width <= container.x + container.width &&
    inner.y + inner.height <= container.y + container.height

export const rectContainsPoint = (rect: Rect, point: { x: number, y: number }) =>
    point.x >= rect.x &&
    point.y >= rect.y &&
    point.x <= rect.x + rect.width &&
    point.y <= rect.y + rect.height

export const getBounds = (...rects: Rect[]) => {
    const minX = Math.min(...rects.map(r => r.x));
    const minY = Math.min(...rects.map(r => r.y));
    const maxX = Math.max(...rects.map(r => r.x + r.width));
    const maxY = Math.max(...rects.map(r => r.y + r.height));
    return {x: minX, y: minY, width: maxX - minX, height: maxY - minY};
}


type QueryMode = 'first' | 'last'

export class CFIView {
    constructor(document: Document, window: Window, selector?: CFISelector<Node>) {
        this._document = document;
        this._window = window;
        this._selector = selector ?? new CFISelectorDOM(document.body);
    }

    protected _document: Document;
    protected _window: Window;
    protected _selector: CFISelector;

    private _isRectValid(rect: Rect) {
        return rect.width > 0 && rect.height > 0;
    }

    private _isRectInView(rect: Rect, mode:'overlap' | 'contains') {
        const windowRect = this._windowRect();

        // ignore invisible elements
        if (!this._isRectValid(rect))
            return false;

        return mode === 'overlap' ? 
            rectsOverlap(windowRect, rect) :
            rectContains(windowRect, rect)
    }

    protected _preprocessRect(rect: Rect) : Rect {
        return rect
    }

    private _rectFromNode(node: Node) : Rect {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const rect = (node as HTMLElement).getBoundingClientRect();
            return this._preprocessRect(rect);
        }
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node as Text;
            const range = this._document.createRange();
            range.selectNode(text);
            const rect = range.getBoundingClientRect();
            return this._preprocessRect(rect);
        }
        return NULL_RECT;
    }

    private _getTextChild(node: Node) : Text | null {
        if (node.nodeType === Node.TEXT_NODE)
            return node as Text;
        if (node.nodeType === Node.ELEMENT_NODE) {
            const children = Array.from(node.childNodes);
            for (const child of children) {
                const text = this._getTextChild(child);
                if (text) return text;
            }
        }
        return null;
    }

    private _windowRect() : Rect {
        const width = this._window.innerWidth;
        const height = this._window.innerHeight;
        return {
            x: 0,
            y: 0,
            width,
            height
        }
    }

    get document() {
        return this._document;
    }

    *iterWords(textNode: Node) {
        const text = textNode.textContent;
        const words = text?.split(' ') ?? [];
        let start = 0, end = 0
        for (const word of words) {
            end = start + word.length;
            const range = this._document.createRange();
            range.setStart(textNode, start);
            range.setEnd(textNode, end);
            yield range;
            start = end + 1;
        }
    }

    addressForClientPoint(point:{x: number, y: number}, focusNode?: Node)  {
        const root = focusNode ?? this._document.body;
        const leaves = CFISelectionUtils.getAllLeafNodes(root);
        for (const leaf of leaves) {
            const textNode = this._getTextChild(leaf);
            if (!textNode)
                continue;
            const words = this.iterWords(textNode);
            let word: IteratorResult<Range, void>;
            while (!(word = words.next()).done) {
                const range = word.value;
                if (!range)
                    continue;
                const rect = this._preprocessRect(range.getBoundingClientRect());
                
                if (rectContainsPoint(rect, point)) {
                    return this._selector.addressFromNode(leaf);
                }
            }
        }
    }

    addressRangeForClientPoint(point:{x: number, y: number}, focusNode?: Node) : [CFISelectionUtils.FullAddress, CFISelectionUtils.FullAddress] | null {
        const root = focusNode ?? this._document.body;
        const leaves = CFISelectionUtils.getAllLeafNodes(root);
        for (const leaf of leaves) {
            const textNode = this._getTextChild(leaf);
            if (!textNode)
                continue;
            const words = this.iterWords(textNode);
            let word: IteratorResult<Range, void>;
            while (!(word = words.next()).done) {
                const range = word.value;
                if (!range)
                    continue;
                const rect = this._preprocessRect(range.getBoundingClientRect());
                
                if (rectContainsPoint(rect, point)) {
                    const nodeAddr = this._selector.addressFromNode(leaf);
                    const startAddr : CFISelectionUtils.FullAddress = [...nodeAddr, `:${range.startOffset}`];
                    const endAddr : CFISelectionUtils.FullAddress = [...nodeAddr, `:${range.endOffset}`];
                    return [startAddr, endAddr];
                }
            }
        }
        return null;
    }

    inViewTextOffset(textNode: Node, mode:QueryMode) {
        const words = this.iterWords(textNode);
        let word: IteratorResult<Range, void>;
        while (!(word = words.next()).done) {
            const range = word.value;
            if (!range)
                continue;
            const rect = this._preprocessRect(range.getBoundingClientRect());
            const isInView = this._isRectInView(rect, 'contains')
            const done = mode === 'first' ? isInView : !isInView;
            if (done) {
                return range.startOffset;
            }
        }
        return null;
    }

    inViewLeafNodes() {
        const body = this._document.body;
        const leaves = CFISelectionUtils.getAllLeafNodes(body);
        return leaves.filter(leaf => this._isRectInView(this._rectFromNode(leaf), 'overlap'));
    }

    inViewAddresses() : [CFISelectionUtils.FullAddress, CFISelectionUtils.FullAddress] | null {
        const leaves = 
            this.inViewLeafNodes()
                .filter(leaf => this._isRectValid(this._rectFromNode(leaf)))
                .sort((a, b) => {
                    const aRect = this._rectFromNode(a);
                    const bRect = this._rectFromNode(b);
                    return aRect.y - bRect.y;
                });
        if (leaves.length === 0)
            return null;

        const startLeaf = leaves[0];
        const endLeaf = leaves[leaves.length - 1];

        const startAddr : CFISelectionUtils.FullAddress = this._selector.addressFromNode(startLeaf);
        const endAddr : CFISelectionUtils.FullAddress = this._selector.addressFromNode(endLeaf);

        const startText = this._getTextChild(startLeaf);
        const endText = this._getTextChild(endLeaf);  

        const startOffset = startText ? this.inViewTextOffset(startText, 'first') : null;
        if (startOffset !== null)
            startAddr.push(`:${startOffset}`);
        const endOffset = endText ? this.inViewTextOffset(endText, 'last') : null;
        if (endOffset !== null)
            endAddr.push(`:${endOffset}`);

        return [startAddr, endAddr];
    }

    rangeFromAddresses(start: CFISelectionUtils.FullAddress, end: CFISelectionUtils.FullAddress) : Range | null {
        const startNode = this._selector.nodeFromAddress(CFISelectionUtils.toNodeAddress(start));
        const endNode = this._selector.nodeFromAddress(CFISelectionUtils.toNodeAddress(end));

        console.log('rangeFromAddresses', startNode, endNode);

        if (!startNode || !endNode)
            return null;

        const offsetStart = CFISelectionUtils.getOffset(start);
        const offsetEnd = CFISelectionUtils.getOffset(end);

        const range = this._document.createRange();
        try {
            range.setStart(startNode, offsetStart ?? 0);
            range.setEnd(endNode, offsetEnd ?? 1);
            return range;
        } catch (e) {
            console.error('Error getting range for addresses', e);
        }
        return null;
    }

    rectsForRange(start: CFISelectionUtils.FullAddress, end: CFISelectionUtils.FullAddress) : Rect[] {
        const range = this.rangeFromAddresses(start, end);
        if (!range)
            return [];

        const rects = range.getClientRects();
        const rectsArray = Array.from(rects).map(rect => this._preprocessRect(rect));
        return rectsArray
            .map(rect => {
                return {
                    width: rect.width,
                    height: rect.height,
                    x: rect.x + this._window.scrollX,
                    y: rect.y + this._window.scrollY
                }
            });
    }

    boundingRectForRange(start: CFISelectionUtils.FullAddress, end: CFISelectionUtils.FullAddress) : Rect | null {
        // We could just call range.getBoundingClientRect(),
        // but that does not account for preprocessing from _preprocessRect()
        const rects = this.rectsForRange(start, end);
        if (rects.length === 0)
            return null;
        return getBounds(...rects);
    }

    setDocumentSelection(start: CFISelectionUtils.FullAddress, end: CFISelectionUtils.FullAddress) {
        const range = this.rangeFromAddresses(start, end);
        if (!range)
            return;
        const selection = this._document.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
    }
}

export class CFIViewLineHeight extends CFIView {
    constructor(...args: ConstructorParameters<typeof CFIView>) {
        super(...args);
        this._refreshLineHeight();
        // this._addStyleObserver();
    }
    private _lineHeight: number | null = null;
    private _refreshLineHeight() {
        console.log('refreshLineHeight');
        const p0 = this._document.querySelector('p')
        if (!p0)
            return null;
        const found = parseFloat(this._window.getComputedStyle(p0).getPropertyValue('line-height'));
        if (isNaN(found) || found <= 0)
            return null;
        this._lineHeight = found;
        return this._lineHeight;
    }
    // private _addStyleObserver() {
    //     const observer = new MutationObserver((mutations) => {
    //         for (const mutation of mutations) {
    //             if (
    //                 mutation.type === 'attributes' &&
    //                 mutation.attributeName === 'style' &&
    //                 mutation.target instanceof HTMLElement &&
    //                 mutation.target.tagName.toLowerCase() === 'p'
    //             ) {
    //                 this._refreshLineHeight();
    //                 break;
    //             }
    //         }
    //     });
    //     observer.observe(this._document.body, { attributes: true, attributeFilter: ['style'], subtree: true });
    // }
    protected _preprocessRect(rect: Rect) : Rect {
        if (rect.width === 0 && rect.height === 0)
            return rect;
        this._refreshLineHeight();
        const lineHeight = this._lineHeight
        if (lineHeight === null)
            return rect;
        const {width, x, y} = rect;
        const result = {height: lineHeight, width, x, y}
        console.log('preprocessRect', rect, result);
        return result
    }
}
