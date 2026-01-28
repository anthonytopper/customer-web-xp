export type Step = number;
export type Offset = `:${number}`;
export type NodeAddress = Step[]
export type FullAddress = (Step | Offset)[]  //NodeAddress | [...NodeAddress, Offset]

export interface SelectorOptions {
    filter?: (node: Node) => boolean;
    terminus?: Node
}
export const addressFromNode = (node: Node, options?: SelectorOptions): NodeAddress => {
    const steps : number[] = [];
    let current: Node = node;
    while (current.parentNode && current !== options?.terminus) {
        const filtered = Array.from(current.parentNode.childNodes).filter(options?.filter ?? (() => true));
        if (current.nodeType === Node.TEXT_NODE) {
            const textNodes = filtered.filter(n => n.nodeType === Node.TEXT_NODE);
            const index = textNodes.findIndex(n => n.isSameNode(current))
            const step = index * 2 + 1;
            steps.push(step);
        } else if (current.nodeType === Node.ELEMENT_NODE) {
            const elementNodes = filtered.filter(n => n.nodeType === Node.ELEMENT_NODE);
            const index = elementNodes.findIndex(n => n.isSameNode(current))
            const step = (index + 1) * 2;
            steps.push(step);
        } else {
            throw new Error(`Invalid node type in hierarchy: ${current.nodeType}`);
        }
        current = current.parentNode;
    }
    return steps.reverse()
}
export const nodeFromAddress = (root: Node, address: NodeAddress, options?: SelectorOptions): Node | null => {
    let currentNode: Node = root;

    for (const step of address) {
        if (!currentNode) return null;
        const filtered = Array.from(currentNode.childNodes).filter(options?.filter ?? (() => true));
        if (step % 2 === 0) {
            // Even step selects an element
            const elementNodes = filtered.filter(n => n.nodeType === Node.ELEMENT_NODE);
            const index = (step / 2) - 1;
            if (elementNodes.length <= index) {
                return null;
            }
            currentNode = elementNodes[index];
        } else {
            // Odd step selects a text node
            const textNodes = filtered.filter(n => n.nodeType === Node.TEXT_NODE);
            const index = (step - 1) / 2;
            if (textNodes.length <= index) {
                return null;
            }
            currentNode = textNodes[index];
        }
    }

    return currentNode;
}
export const isValidAddress = ([first, ...rest]: FullAddress) : boolean => 
    // Offset must be terminal
    typeof first === 'string' ? 
        rest.length === 0 
    
    // Odd step must be terminal OR followed by an offset
    : first % 2 !== 0 ?
        (
            rest.length === 0 || 
            (rest.length === 1 && typeof rest[0] === 'string') || 
            false
        )
    :
        isValidAddress(rest as FullAddress)
    
export const getOffset = (address: FullAddress) : number | null => {
    const offset = address.find(step => typeof step === 'string');
    if (!offset) return null;
    return parseInt((offset as string).substring(1));
}

export const toNodeAddress = (address: FullAddress) => 
    address.filter(step => typeof step === 'number') as NodeAddress

export const commonSteps = (start: NodeAddress, end: NodeAddress): NodeAddress => {
    const result: NodeAddress = [];
    for (let i = 0; i < start.length && i < end.length; i++) {
        if (start[i] !== end[i]) {
            return result;
        }
        const step = start[i];
        if (typeof step === 'number') result.push(step);
    }
    return result;
}

export const addressesEqual = (addr1: FullAddress, addr2: FullAddress): boolean => {
    if (addr1.length !== addr2.length) return false;
    for (let i = 0; i < addr1.length; i++) {
        if (addr1[i] !== addr2[i]) return false;
    }
    return true;
}

// non-inclusive
export const getPeerNodesBefore = (node: Node): Node[] => {
    const parent = node.parentNode;
    if (!parent) {
        return [];
    }
    const nodes: Node[] = [];
    for (let i = 0; i < parent.childNodes.length; i++) {
        const child = parent.childNodes[i];
        if (child.isSameNode(node)) 
            break;
        nodes.push(child);
    }
    return nodes;
}
// non-inclusive
export const getPeerNodesAfter = (node: Node): Node[] => {
    const parent = node.parentNode;
    if (!parent) {
        return [];
    }
    const nodes: Node[] = [];
    let found = false;
    for (let i = 0; i < parent.childNodes.length; i++) {
        const child = parent.childNodes[i];
        if (found) nodes.push(child);
        if (child.isSameNode(node)) found = true;
    }
    return nodes;
}
// non-inclusive
export const getPeerNodesBetween = (start: Node, end: Node): Node[] => {
    const parent = start.parentNode;
    if (!parent) return [];
    const nodes: Node[] = [];
    let found = false;
    for (let i = 0; i < parent.childNodes.length; i++) {
        const child = parent.childNodes[i];
        if (child.isSameNode(end)) return nodes;
        if (found) nodes.push(child);
        if (child.isSameNode(start)) found = true;
    }
    return nodes;
}
export const getAllLeafNodes = (node: Node): Node[] => {
    const leaves: Node[] = [];
    if (node.childNodes.length === 0) {
        // This is a leaf element
        leaves.push(node);
    } else {
        // Recursively check children
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            leaves.push(...getAllLeafNodes(child));
        }
    }
    return leaves;
}
export const getAllLeafElements = (node: Node): Node[] => {
    const leaves: Node[] = [];
    const contentfulChildren = Array.from(node.childNodes).filter(n => n.nodeType === Node.ELEMENT_NODE);
    if (contentfulChildren.length === 0) {
        // This is a leaf element
        leaves.push(node);
    } else {
        // Recursively check children
        for (let i = 0; i < contentfulChildren.length; i++) {
            const child = contentfulChildren[i];
            leaves.push(...getAllLeafElements(child));
        }
    }
    return leaves;
}
export const isContentful = (node: Node): boolean => {
    if (node.nodeType === Node.ELEMENT_NODE) {
        return true // TODO: further checks?
    }
    if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent?.trim() !== '';
    }
    return true;
}
export const getFirstContentfulChild = (node: Node): Node | null => {
    const child = node.firstChild;
    if (child && isContentful(child)) return child;
    for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (isContentful(child)) return child;
    }
    return null;
}
export const getLastContentfulChild = (node: Node): Node | null => {
    const child = node.lastChild;
    if (child && isContentful(child)) return child;
    for (let i = node.childNodes.length - 1; i >= 0; i--) {
        const child = node.childNodes[i];
        if (isContentful(child)) return child;
    }
    return null;
}