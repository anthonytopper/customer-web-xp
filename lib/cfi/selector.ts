import { type NodeImpl, NodeImplDOM } from "./node";
import { RangeOperations } from "./range";
import * as CFISelectionUtils from "./utils";


export interface CFISelectorOptions<N = Node> {
    traversalFilter?   : (node: N) => boolean;
    extractFilter?  : (node: N) => boolean;
    extractor?      : (node: N, startOffset?: number, endOffset?: number) => string;
}

type FullAddress = CFISelectionUtils.FullAddress
type NodeAddress = CFISelectionUtils.NodeAddress

export class CFISelector<N = Node> {
    private root: N
    private nodeImpl: NodeImpl<N>
    protected options?: CFISelectorOptions<N>

    constructor(root: N, nodeImpl: NodeImpl<N>, options?: CFISelectorOptions<N>) {
        this.root = root;
        this.nodeImpl = nodeImpl;
        this.options = options;
    }

    private extractText(node: N, startOffset = 0, endOffset : number | undefined = undefined): string {
        if (this.options?.extractFilter?.(node) === false)
            return '';
        return (
            this.options?.extractor?.(node, startOffset, endOffset) ?? 
            (
                this.nodeImpl.getTextContent(node).substring(startOffset, endOffset) ?? 
                ''
            )
        );
    }

    private extractTextBetween(start: N, end: N): string {
        const betweenNodes = this.getPeerNodesBetween(start, end);
        const filtered = betweenNodes.filter(node => this.options?.traversalFilter?.(node) ?? true);
        const betweenText = filtered.map(node => this.extractText(node)).join('');
        return betweenText;
    }

    getRoot(): N {
        return this.root;
    }

    getNodeImpl(): NodeImpl<N> {
        return this.nodeImpl;
    }
    
    buildSelector(node: N) {
        return new CFISelector(node, this.nodeImpl, this.options);
    }

    addressFromNode(node: N): NodeAddress {
        const steps : number[] = [];
        let current: N = node;
        while (current !== this.root) {
            const parent = this.nodeImpl.getParentNode(current);
            if (!parent) break;
            const childNodes = this.nodeImpl.getAllChildNodes(parent);
            const filtered = childNodes.filter(this.options?.traversalFilter ?? (() => true));
            if (this.nodeImpl.getNodeType(current) === 'text') {
                const textNodes = filtered.filter(n => this.nodeImpl.getNodeType(n) === 'text');
                const index = textNodes.findIndex(n => this.nodeImpl.isSameNode(n, current))
                const step = index * 2 + 1;
                steps.push(step);
            } else if (this.nodeImpl.getNodeType(current) === 'element') {
                const elementNodes = filtered.filter(n => this.nodeImpl.getNodeType(n) === 'element');
                const index = elementNodes.findIndex(n => this.nodeImpl.isSameNode(n, current))
                const step = (index + 1) * 2;
                steps.push(step);
            } else {
                throw new Error(`Invalid node type in hierarchy: ${this.nodeImpl.getNodeType(current)}`);
            }
            current = parent;
        }
        return steps.reverse()
    }
    nodeFromAddress(address: NodeAddress): N | null {
        let currentNode: N = this.root;

        for (const step of address) {
            if (!currentNode) return null;
            const childNodes = this.nodeImpl.getAllChildNodes(currentNode);
            const filtered = childNodes.filter(this.options?.traversalFilter ?? (() => true));
            if (step % 2 === 0) {
                // Even step selects an element
                const elementNodes = filtered.filter(n => this.nodeImpl.getNodeType(n) === 'element');
                const index = (step / 2) - 1;
                if (elementNodes.length <= index) {
                    return null;
                }
                currentNode = elementNodes[index];
            } else {
                // Odd step selects a text node
                const textNodes = filtered.filter(n => this.nodeImpl.getNodeType(n) === 'text');
                const index = (step - 1) / 2;
                if (textNodes.length <= index) {
                    return null;
                }
                currentNode = textNodes[index];
            }
        }
    
        return currentNode;
    }

    // non-inclusive
    getPeerNodesBefore(node: N): N[] {
        const parent = this.nodeImpl.getParentNode(node);
        if (!parent) {
            return [];
        }
        const nodes: N[] = [];
        const childNodes = this.nodeImpl.getAllChildNodes(parent);
        for (let i = 0; i < childNodes.length; i++) {
            const child = childNodes[i];
            if (this.nodeImpl.isSameNode(child, node)) 
                break;
            nodes.push(child);
        }
        return nodes;
    }

    // non-inclusive
    getPeerNodesAfter(node: N): N[] {
        const parent = this.nodeImpl.getParentNode(node);
        if (!parent) {
            return [];
        }
        const nodes: N[] = [];
        let found = false;
        const childNodes = this.nodeImpl.getAllChildNodes(parent);
        for (let i = 0; i < childNodes.length; i++) {
            const child = childNodes[i];
            if (found) nodes.push(child);
            if (this.nodeImpl.isSameNode(child, node)) found = true;
        }
        return nodes;
    }

    // non-inclusive
    getPeerNodesBetween(start: N, end: N): N[] {
        const parent = this.nodeImpl.getParentNode(start);
        if (!parent) return [];
        const nodes: N[] = [];
        let found = false;
        const childNodes = this.nodeImpl.getAllChildNodes(parent);
        for (let i = 0; i < childNodes.length; i++) {
            const child = childNodes[i];
            if (this.nodeImpl.isSameNode(child, end)) return nodes;
            if (found) nodes.push(child);
            if (this.nodeImpl.isSameNode(child, start)) found = true;
        }
        return nodes;
    }
    getAllLeafNodes(node: N): N[] {
        const leaves: N[] = [];
        const childNodes = this.nodeImpl.getAllChildNodes(node);
        if (childNodes.length === 0) {
            // This is a leaf element
            leaves.push(node);
        } else {
            // Recursively check children
            for (let i = 0; i < childNodes.length; i++) {
                const child = childNodes[i];
                leaves.push(...this.getAllLeafNodes(child));
            }
        }
        return leaves;
    }
    getAllLeafElements(node: N): N[] {
        const leaves: N[] = [];
        const contentfulChildren = this.nodeImpl.getAllChildNodes(node).filter(n => this.nodeImpl.getNodeType(n) === 'element');
        if (contentfulChildren.length === 0) {
            // This is a leaf element
            leaves.push(node);
        } else {
            // Recursively check children
            for (let i = 0; i < contentfulChildren.length; i++) {
                const child = contentfulChildren[i];
                leaves.push(...this.getAllLeafElements(child));
            }
        }
        return leaves;
    }
    isContentful(node: N): boolean {
        if (this.options?.traversalFilter?.(node) === false)
            return false;
        if (this.nodeImpl.getNodeType(node) === 'element') {
            return true // TODO: further checks?
        }
        if (this.nodeImpl.getNodeType(node) === 'text') {
            return this.nodeImpl.getTextContent(node).trim() !== '';
        }
        return true;
    }
    getFirstContentfulChild(node: N): N | null {
        const child = this.nodeImpl.getFirstChild(node);
        if (child && this.isContentful(child)) return child;
        const childNodes = this.nodeImpl.getAllChildNodes(node);
        for (let i = 0; i < childNodes.length; i++) {
            const child = childNodes[i];
            if (this.isContentful(child)) return child;
        }
        return null;
    }
    getLastContentfulChild(node: N): N | null {
        const child = this.nodeImpl.getLastChild(node);
        if (child && this.isContentful(child)) return child;
        const childNodes = this.nodeImpl.getAllChildNodes(node);
        for (let i = childNodes.length - 1; i >= 0; i--) {
            const child = childNodes[i];
            if (this.isContentful(child)) return child;
        }
        return null;
    }

    // elementFromAddress(address: NodeAddress): Element | null {
    //     const node = this.nodeFromAddress(address);
    //     if (!node) return null;
    //     if (!NodeImpl.isElement(node)) return null;
    //     return node as Element;
    // }

    extractTextRange(start: FullAddress = [], end: FullAddress = []): string {
        if (start.length === 0 && end.length === 0) 
            return this.extractText(this.root);

        if (start.length === 0)
            return this.extractTextRelative(end, 'before');

        if (end.length === 0)
            return this.extractTextRelative(start, 'after');

        const nodeStart = CFISelectionUtils.toNodeAddress(start);
        const nodeEnd = CFISelectionUtils.toNodeAddress(end);
        const commonSteps = CFISelectionUtils.commonSteps(nodeStart, nodeEnd);
        if (commonSteps.length > 0) {
            const commonNode = this.nodeFromAddress(commonSteps);
            if (!commonNode) 
                return '';
            
            const childStartAddress = start.slice(commonSteps.length);
            const childEndAddress = end.slice(commonSteps.length);
            return this.buildSelector(commonNode).extractTextRange(childStartAddress, childEndAddress);
        }

        const [rootStart, ...subStart] = start;
        const [rootEnd, ...subEnd] = end;

        if (typeof rootStart === 'string' && typeof rootEnd === 'string') {
            return this.extractText(this.root, parseInt(rootStart.substring(1)), parseInt(rootEnd.substring(1)));
        }
        if (typeof rootStart === 'string') {
            throw new Error('Start offset not supported for root node');
        }
        if (typeof rootEnd === 'string') {
            throw new Error('End offset not supported for root node');
        }

        const rootStartNode = this.nodeFromAddress([rootStart!]);
        const rootEndNode = this.nodeFromAddress([rootEnd!]);
        if (!rootStartNode || !rootEndNode) 
            return '';


        const startText = this.buildSelector(rootStartNode).extractTextRange(subStart, []);
        const endText = this.buildSelector(rootEndNode).extractTextRange([], subEnd);

        const betweenText = this.extractTextBetween(rootStartNode, rootEndNode);


        return startText + '' + betweenText + '' + endText;
    }

    extractTextRelative(address?: FullAddress, mode?: 'after' | 'before'): string {

        const isRoot = !address || address.length === 0;
        if (isRoot) {
            return this.extractText(this.root);
        }
        const [firstStep, ...subSteps] = address;
        if (typeof firstStep === 'string') {
            if (mode === 'after') {
                return this.extractText(this.root, parseInt(firstStep.substring(1)));
            }
            return this.extractText(this.root, 0, parseInt(firstStep.substring(1)));
        }
        const childNode = this.nodeFromAddress([firstStep!]);
        if (!childNode) {
            return '';
        }
        const childSelector = this.buildSelector(childNode);
        let childText = childSelector.extractTextRelative(subSteps, mode);
        
        if (mode) {
            const peerNodes = 
                mode === 'after' ? 
                    this.getPeerNodesAfter(childNode) 
                : 
                    this.getPeerNodesBefore(childNode);

            const peerText = peerNodes.map(node => this.extractText(node)).join('');

            if (mode === 'after')
                childText = childText + '' + peerText;
            else
                childText = peerText + '' + childText;
        }
        return childText;
    }

    getStartAddress(): NodeAddress {
        const child = this.getFirstContentfulChild(this.root);
        if (!child)
            return [];
        const childAddress = this.addressFromNode(child);
        const childSelector = this.buildSelector(child);
        return [...childAddress, ...childSelector.getStartAddress()];
    }

    getEndAddress(): NodeAddress {
        const child = this.getLastContentfulChild(this.root);
        if (!child)
            return [];

        const childAddress = this.addressFromNode(child);
        const childSelector = this.buildSelector(child);
        return [...childAddress, ...childSelector.getEndAddress()];
    }

    getStartAddressWithOffset(): FullAddress {
        const nodeAddr = this.getStartAddress();
        const node = this.nodeFromAddress(nodeAddr);
        if (node && this.nodeImpl.getNodeType(node) === 'text') {
            return [...nodeAddr, ':0'];
        }
        return nodeAddr;
    }

    getEndAddressWithOffset(): FullAddress {
        const nodeAddr = this.getEndAddress();
        const node = this.nodeFromAddress(nodeAddr);
        if (node && this.nodeImpl.getNodeType(node) === 'text') {
            const textContent = this.nodeImpl.getTextContent(node);
            return [...nodeAddr, `:${textContent.length ?? 0}`];
        }
        return nodeAddr;
    }

    // return -1 if addr1 < addr2, 0 if equal, 1 if addr1 > addr2
    compareAddresses(addr1: FullAddress, addr2: FullAddress): number {
        const node1 = this.nodeFromAddress(CFISelectionUtils.toNodeAddress(addr1));
        const node2 = this.nodeFromAddress(CFISelectionUtils.toNodeAddress(addr2));

        if (!node1 || !node2)
            return 0;

        const nodesEqual = this.nodeImpl.isSamePosition(node1, node2)

        if (nodesEqual) {
            const offset1 = CFISelectionUtils.getOffset(addr1) ?? 0;
            const offset2 = CFISelectionUtils.getOffset(addr2) ?? 0;
            if (offset1 !== offset2)
                return offset1 - offset2;
            return 0;
        }

        const isNode1First = this.nodeImpl.isBefore(node1, node2);

        return isNode1First ? -1 : 1;
    }

    // address range operations
    range = new RangeOperations<FullAddress>((a,b) => this.compareAddresses(a,b));
}

export class CFISelectorDOM extends CFISelector<Node> {
    constructor(root: Node, options?: CFISelectorOptions<Node>) {
        super(root, NodeImplDOM, options);
    }

    buildSelector(node: Node): CFISelector<Node> {
        return new CFISelectorDOM(node, this.options);
    }

    fromDOMRange(range: Range): [FullAddress, FullAddress] {
		const start = range.startContainer;
		const end = range.endContainer;

		const startOffset = range.startOffset;
		const endOffset = range.endOffset;

		const startAddress = this.addressFromNode(start);
		const endAddress = this.addressFromNode(end);

		return [[...startAddress, `:${startOffset}`], [...endAddress, `:${endOffset}`]];
    }
}


/**
 * 
 *    <parent>
 *        <child></child>     <--  [2]
 *        <child></child>     <--  [4]
 *        <child>
 *            <leaf></leaf>   <--  [6, 2]
 *            <leaf></leaf>   <--  [6, 4]
 *        </child>
 *    </parent>
 * 
 * 
 * 
 * Range [4, 2, 4] -> [6, 4]
 *    <parent>
 *        <child></child>          <--  [2]
 *        <child>                  <--  [4]
 *            <child>              <--  [4, 2]
 *                <leaf></leaf>    <--  [4, 2, 2]
 *                <leaf></leaf>    <--  [4, 2, 4]    ** start
 *            </child>             
 *            <child>              <--  [4, 4]
 *                <leaf></leaf>    <--  [4, 4, 2]
 *                <leaf></leaf>    <--  [4, 4, 4]
 *            </child>             
 *            <leaf></leaf>        <--  [4, 6]
 *            <leaf></leaf>        <--  [4, 8]
 *        </child>
 *        <child>
 *            <leaf></leaf>        <--  [6, 2]
 *            <leaf></leaf>        <--  [6, 4]       ** end
 *            <leaf></leaf>        <--  [6, 6]
 *        </child>
 *    </parent>
 */


