import * as CFIDisplayUtils from "./display";
import * as CFISelectionUtils from "./utils";
import { GeometryUtils } from "./geometry";

type CFIView = CFIDisplayUtils.CFIView;

export interface HighlightParams {
    id          : string;
    startAddr   : CFISelectionUtils.FullAddress
    endAddr     : CFISelectionUtils.FullAddress
    color       : string;
    classNames? : string[];
}

interface CFIHighlightsOptions {
    className : string;
}

const DEFAULT_OPTIONS: CFIHighlightsOptions = {
    className: '__highlight_region__',
}

interface RegisteredHighlight extends HighlightParams {
    elements: HTMLElement[];
}


export abstract class CFIHighlightsManager {
    protected _options: CFIHighlightsOptions;
    protected _registered: RegisteredHighlight[] = [];
    
    constructor(protected _view: CFIView, options?: Partial<CFIHighlightsOptions>) {
        this._options = {
            ...DEFAULT_OPTIONS,
            ...options
        }
    }

    protected abstract _elementsForHighlight(highlight: HighlightParams) : HTMLElement[];

    protected _findHighlightForClientPoint(clientX: number, clientY: number) {
        const elements = Array.from(this._view.document.querySelectorAll(`.${this._options.className}`));
        for (const element of elements) {
            const rect = element.getBoundingClientRect();
            if (CFIDisplayUtils.rectContainsPoint(rect, { x: clientX, y: clientY })) {
                return element;
            }
        }
        return null;
    }
    
    protected _getHighlightElementForMouseEvent(e: MouseEvent) {
        const x = e.clientX;
        const y = e.clientY;
        const el = this._findHighlightForClientPoint(x, y);
        if (el) {
            return el;
        }
        return null;
    }

    protected _listElementsForId(id: string) {
        return Array.from(this._view.document.querySelectorAll(`.${this._options.className}[data-id="${id}"]`));
    }

    protected _getBoundingRectForId(id: string) {
        const elements = this._listElementsForId(id);
        if (elements.length === 0) {
            return undefined;
        }
        const rects = elements.map(el => el.getBoundingClientRect());
        const bounds = CFIDisplayUtils.getBounds(...rects);
        return bounds;
    }

    protected _findHighlightByAddrRange(startAddr: CFISelectionUtils.FullAddress, endAddr: CFISelectionUtils.FullAddress) {
        for (const registered of this._registered) {
            const startAddrsEqual = CFISelectionUtils.addressesEqual(startAddr, registered.startAddr);
            const endAddrsEqual = CFISelectionUtils.addressesEqual(endAddr, registered.endAddr);
            if (startAddrsEqual && endAddrsEqual) {
                return registered;
            }
        }
    }

    getHighlightIdForMouseEvent(e: MouseEvent) {
        const element = this._getHighlightElementForMouseEvent(e);
        if (element) {
            const id = element.getAttribute('data-id');
            if (id) {
                const rect = this._getBoundingRectForId(id);
                return {id, rect}
            }
        }
        return {id: undefined, rect: undefined};
    }

    add(params:HighlightParams) {
        const elements = this._elementsForHighlight(params);
        this._registered.push({...params, elements});
    }

    addIfNotExists(params:HighlightParams) {
        const existing = this._findHighlightByAddrRange(params.startAddr, params.endAddr);
        if (existing) {
            return;
        }
        this.add(params);
    }

    remove(id: string) {
        const elements = this._listElementsForId(id);
        for (const element of elements) {
            element.remove();
        }
        this._registered = this._registered.filter(registered => registered.id !== id);
    }

    reflow() {
        const paramsList = this._registered.map(({elements, ...params}) => params);
        this.removeRegistered();
        for (const params of paramsList) {
            this.add(params);
        }
    }

    removeRegistered() {
        for (const registered of this._registered) {
            registered.elements.forEach(element => element.remove());
        }
        this._registered = [];
    }

    removeAllElements() {
        const elements = Array.from(this._view.document.querySelectorAll(`.${this._options.className}`));
        for (const element of elements) {
            element.remove();
        }
    }

    removeAll() {
        this.removeRegistered();
        // Cleanup any extra unregistered elements
        this.removeAllElements();
    }
}

export class CFIHighlightsManagerRects extends CFIHighlightsManager {

    protected _removeDuplicateRects(rects: CFIDisplayUtils.Rect[]) {
        const uniqueRects = rects.filter((rect, index, self) =>
            index === self.findIndex((t) => t.x === rect.x && t.y === rect.y && t.width === rect.width && t.height === rect.height)
        );
        return uniqueRects;
    }

    protected _elementForRect(rect:CFIDisplayUtils.Rect) {
        const element = document.createElement('div');
        element.style.position = 'absolute';
        element.style.left = `${rect.x}px`;
        element.style.top = `${rect.y}px`;
        element.style.width = `${rect.width}px`;
        element.style.height = `${rect.height}px`;
        element.style.zIndex = '1000';
        element.style.pointerEvents = 'none';
        element.style.mixBlendMode = 'multiply';
    
        element.classList.add(this._options.className);
    
        return element;
    }
    
    protected _elementsForHighlight(highlight: HighlightParams) {
        const {startAddr, endAddr, id, color, classNames} = highlight;
        const rects = this._view.rectsForRange(startAddr, endAddr);
        const uniqueRects = this._removeDuplicateRects(rects);
    
        const elements : HTMLElement[] = [];
    
        for (const rect of uniqueRects) {
            const element = this._elementForRect(rect);
            element.style.backgroundColor = color;
            element.setAttribute('data-id', id);
            if (classNames) {
                for (const className of classNames) {
                    element.classList.add(className);
                }
            }
            this._view.document.body.appendChild(element);
            elements.push(element);
        }
        return elements;
    }

}


export class CFIHighlightsManagerSVG extends CFIHighlightsManager {
    
    /**
     * Calculates the bounding box for all paths
     */
    protected _getPathsBounds(paths: GeometryUtils.Path[]): GeometryUtils.Rect | null {
        if (paths.length === 0) {
            return null;
        }
        
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        
        for (const path of paths) {
            for (const point of path) {
                minX = Math.min(minX, point.x);
                minY = Math.min(minY, point.y);
                maxX = Math.max(maxX, point.x);
                maxY = Math.max(maxY, point.y);
            }
        }
        
        if (minX === Infinity) {
            return null;
        }
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    protected _elementsForHighlight(highlight: HighlightParams) {
        const {startAddr, endAddr, id, color, classNames} = highlight;
        
        // Get rects from the view
        const rects = this._view.rectsForRange(startAddr, endAddr);
        if (rects.length === 0) {
            return [];
        }
        
        // Convert CFIDisplayUtils.Rect[] to GeometryUtils.Rect[]
        const geometryRects: GeometryUtils.Rect[] = rects.map(rect => ({
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
        }));
        
        // Merge rects into paths
        const paths = GeometryUtils.mergeRects(geometryRects);
        if (paths.length === 0) {
            return [];
        }

        console.log('[CFIHighlightsManagerSVG] _elementsForHighlight rects', geometryRects, paths);

        
        // Calculate bounding box for positioning the SVG
        const bounds = this._getPathsBounds(paths);
        if (!bounds) {
            return [];
        }
        
        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        svg.style.left = `${bounds.x}px`;
        svg.style.top = `${bounds.y}px`;
        svg.style.width = `${bounds.width}px`;
        svg.style.height = `${bounds.height}px`;
        svg.style.zIndex = '1000';
        svg.style.pointerEvents = 'none';
        svg.style.mixBlendMode = 'multiply';
        svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
        svg.setAttribute('preserveAspectRatio', 'none');
        
        svg.classList.add(this._options.className);
        svg.setAttribute('data-id', id);
        
        if (classNames) {
            for (const className of classNames) {
                svg.classList.add(className);
            }
        }
        
        // Create path elements for each merged path
        for (const path of paths) {
            const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            // Convert path points to SVG coordinates (relative to bounds)
            const svgPathString = path.map((point, index) => {
                const x = point.x - bounds.x;
                const y = point.y - bounds.y;
                return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
            }).join(' ') + ' Z';
            
            pathElement.setAttribute('d', svgPathString);
            pathElement.setAttribute('fill', color);
            pathElement.setAttribute('stroke', 'none');
            
            svg.appendChild(pathElement);
        }
        
        // Append SVG to document body
        this._view.document.body.appendChild(svg);
        
        // Both SVGSVGElement and HTMLElement extend Element, so we can cast through Element
        return [svg as Element as HTMLElement];
    }
    
}
