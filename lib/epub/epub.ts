/**
 * File: services/epub/epub.ts
 *
 * Overview:
 * - Service module encapsulating business logic, side effects, or integrations. Exports: Epub
 *
 * Dependencies:
 * - ../cfi/helper
 * - ../cfi/node
 * - ../cfi/selector
 * - ../util/string
 * - @xmldom/xmldom
 * - fast-xml-parser
 * - fs/promises
 *
 * Architectural Notes:
 * - EPUB domain utilities and injected scripts; isolate DOM/WebView concerns here.
 * - Avoid RN UI imports; expose pure helpers or side-effect boundaries only.
 *
 * Auto-generated header (2025-10-24). Review and refine as needed.
 */
import { DOMParser } from '@xmldom/xmldom'
import { XMLParser } from 'fast-xml-parser'
import { readFile } from 'fs/promises'
import { CFI } from '../cfi/helper'
import { NodeImplXMLDom, type XMLDomNode } from '../cfi/node'
import { CFISelector } from '../cfi/selector'
import { joinPath } from '@/lib/util/string'

const OEBPS_DIR = 'OEBPS'

export interface Itemref {
    idref: string
}
export interface Spine {
    itemref: Itemref[]
}

export interface ManifestItem {
    id: string
    href: string
    mediaType: string
}

export interface Manifest {
    item: ManifestItem[]
}

export interface Package {
    manifest: Manifest
    spine: Spine
}

export class Epub {

    static async open(rootPath: string): Promise<Epub> {
        const epub = new Epub(rootPath)
        await epub.load()
        return epub
    }

    private _rootPath: string
    private _package?: Package

    private constructor(rootPath: string) {
        this._rootPath = rootPath
    }

    private _opfFilePath(rootPath: string) {
        return this._joinPath(rootPath, OEBPS_DIR, 'content.opf')
    }

    private async _opfFile(rootPath: string) {
        const filePath = this._opfFilePath(rootPath)
        return await readFile(filePath, 'utf8')
    }

    private async _parsePackage(rootPath: string): Promise<Package> {
        const opfFile = await this._opfFile(rootPath)
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '',
            transformAttributeName: (attrName: string) =>
                attrName.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase()),
            isArray: (name: string, jpath: string) =>
                jpath === 'package.manifest.item' || jpath === 'package.spine.itemref',
        })
        const parsed = parser.parse(opfFile)
        return parsed.package as Package
    }

    private _joinPath(...parts: string[]): string {
        return joinPath(...parts)
    }

    get rootPath() {
        return this._rootPath
    }

    get oebpsPath() {
        return this._joinPath(this.rootPath, OEBPS_DIR)
    }

    get manifest() {
        if (!this._package) {
            throw new Error('Package not loaded')
        }
        return this._package.manifest
    }
    get spine() {
        if (!this._package) {
            throw new Error('Package not loaded')
        }
        return this._package.spine
    }

    spineFilePath(index: number) {
        const itemref = this.spine.itemref[index]
        const item = this.manifest.item.find(item => item.id === itemref.idref)
        return item?.href
    }

    spineFileUri(index: number) {
        const filePath = this.spineFilePath(index)
        if (!filePath) {
            return null
        }
        const fullPath = this._joinPath(this.rootPath, OEBPS_DIR, filePath)
        return `file://${fullPath}`
    }

    async load() {
        this._package = await this._parsePackage(this.rootPath)
    }

    async spineFile(index: number): Promise<string | null> {
        const filePath = this.spineFilePath(index)
        if (!filePath) {
            return null
        }
        const absolutePath = this._joinPath(this.rootPath, OEBPS_DIR, filePath)
        const data = await readFile(absolutePath, 'utf8')
        return data
    }
    async spineDOM(index: number): Promise<Document | null> {
        const filePath = this.spineFilePath(index)
        if (!filePath) {
            return null
        }
        const absolutePath = this._joinPath(this.rootPath, OEBPS_DIR, filePath)
        const data = await readFile(absolutePath, 'utf8')
        return new DOMParser().parseFromString(data, 'text/xml')
    }
    async spineBodySelector(index: number) {
        const dom = await this.spineDOM(index)
        if (!dom) {
            return null
        }
        const htmlRootChildren = Array.from(dom.documentElement.childNodes)
        const body = htmlRootChildren.find(node => node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'body')
        if (!body) {
            return null
        }
        const selector = new CFISelector<XMLDomNode>(body, NodeImplXMLDom)
        return selector
    }

    async wordCountInRange(startCfi: string, endCfi: string) {
        const text = await this.extractTextRange(startCfi, endCfi);
        return text.trim().split(/\s+/).length;
    }
    
    async extractTextRange(startCfi: string, endCfi: string) {
        const start = CFI.fromString(startCfi);
        const end = CFI.fromString(endCfi);

        const startSpineIndex = start.spineIndex / 2 - 1;
        const endSpineIndex = end.spineIndex / 2 - 1;

        let text = '';
        for (let i = startSpineIndex; i <= endSpineIndex; i++) {
            const isFirst = i === startSpineIndex;
            const isLast = i === endSpineIndex;
            const selector = await this.spineBodySelector(i)
            if (!selector) {
                continue;
            }
            const sectionText = selector.extractTextRange(
                isFirst ? start.toSelectorAddress() : [], 
                isLast ? end.toSelectorAddress() : []
            );
            text += sectionText + '\n';
        }
        return text;
    }
}