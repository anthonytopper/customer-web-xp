
export type NodeType = 'text' | 'element' | 'other';

export interface NodeImpl<N = Node> {
    getParentNode: (node: N) => N | null;
    getAllChildNodes: (node: N) => N[];
    iterChildNodes(node: N): Generator<N>;
    getFirstChild: (node: N) => N | null;
    getLastChild: (node: N) => N | null;
    getNodeType: (node: N) => NodeType;
    getTextContent: (node: N) => string;
    getAttribute: (node: N, name: string) => string | null;
    setAttribute: (node: N, name: string, value: string) => void;
    removeAttribute: (node: N, name: string) => void;


    /**
     * returns true if node is before other
     * @param node
     * @param other
     * @returns boolean
     */
    isBefore: (node: N, other: N) => boolean;

    /**
     * returns true if node is after other
     * @param node
     * @param other
     * @returns boolean
     */
    isAfter: (node: N, other: N) => boolean;
    isSamePosition: (node: N, other: N) => boolean;
    isAncestorOf: (node: N, other: N) => boolean;
    isDescendantOf: (node: N, other: N) => boolean;
    isContentful: (node: N) => boolean;
    isSameNode: (node: N, other: N) => boolean;
}

export const NodeImplDOM : NodeImpl = {
    getParentNode : (node: Node): Node | null => {
        return node.parentNode;
    },
    getAllChildNodes : (node: Node): Node[] => {
        const childNodes = node.childNodes;
        if (!childNodes) return [];
        const children = Array.from(childNodes)
        return children;
    },
    *iterChildNodes(node: Node): Generator<Node> {
        if (!node.childNodes) return;
        for (let i = 0; i < node.childNodes.length; i++) {
            yield node.childNodes[i];
        }
    },
    getFirstChild : (node: Node): Node | null => {
        return node.firstChild;
    },
    getLastChild : (node: Node): Node | null => {
        return node.lastChild;
    },
    getNodeType : (node: Node): NodeType => {
        return node.nodeType === Node.ELEMENT_NODE ? 'element' : node.nodeType === Node.TEXT_NODE ? 'text' : 'other';
    },
    getTextContent(node: Node): string {
        return node.textContent || '';
    },
    getAttribute : (node: Node, name: string): string | null => {
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return null;
        }
        return (node as Element).getAttribute(name);
    },  
    setAttribute : (node: Node, name: string, value: string): void => {
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return;
        }
        (node as Element).setAttribute(name, value);
    },
    removeAttribute : (node: Node, name: string): void => {
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return;
        }
        (node as Element).removeAttribute(name);
    },
    // returns true if node is before other
    isBefore : (node: Node, other: Node): boolean => {
        return (node.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    },
    // returns true if node is after other
    isAfter : (node: Node, other: Node): boolean => {
        return (node.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_PRECEDING) !== 0;
    },
    isSamePosition : (node: Node, other: Node): boolean => {
        return node.compareDocumentPosition(other) === 0;
    },
    isAncestorOf : (node: Node, other: Node): boolean => {
        return (node.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_CONTAINS) !== 0;
    },
    isDescendantOf : (node: Node, other: Node): boolean => {
        return (node.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_CONTAINED_BY) !== 0;
    },
    isContentful : (node: Node): boolean => {
        return node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE;
    },
    isSameNode : (node: Node, other: Node): boolean => {
        return node.isSameNode(other);
    }
}

export interface XMLDomNode extends Node {
    lineNumber?: number;
    columnNumber?: number;
}

export const NodeImplXMLDom : NodeImpl<XMLDomNode> = {
    ...NodeImplDOM,
    isSameNode(node: XMLDomNode, other: XMLDomNode): boolean {
        return node === other;
    },
    isSamePosition : (node: XMLDomNode, other: XMLDomNode) => 
        node.lineNumber === other.lineNumber && node.columnNumber === other.columnNumber,
    isAfter : (node: XMLDomNode, other: XMLDomNode): boolean => {
        const line1 = node.lineNumber ?? 0;
        const line2 = other.lineNumber ?? 0;
        if (line1 === line2) {
            const column1 = node.columnNumber ?? 0;
            const column2 = other.columnNumber ?? 0;
            return column1 > column2;
        }
        return line1 > line2;
    },
    isBefore : (node: XMLDomNode, other: XMLDomNode): boolean => {
        const line1 = node.lineNumber ?? 0;
        const line2 = other.lineNumber ?? 0;
        if (line1 === line2) {
            const column1 = node.columnNumber ?? 0;
            const column2 = other.columnNumber ?? 0;
            return column1 < column2;
        }
        return line1 < line2;
    },
}

// !!! textContent works on Element and Text
// !!! nodeType works on Element and Text
// !!! getAttribute works on Element and Text


// Element {
//     _nsMap: {},
//     attributes: [Object],
//     childNodes: [Object],
//     ownerDocument: [Document],
//     nodeName: 'p',
//     tagName: 'p',
//     namespaceURI: 'http://www.w3.org/1999/xhtml',
//     localName: 'p',
//     parentNode: [Element],
//     previousSibling: [Text],
//     nextSibling: [Text],
//     lineNumber: 32,
//     columnNumber: 1,
//     firstChild: [Text],
//     lastChild: [Text]
//   }

// Text {
//     ownerDocument: [Document],
//     data: 'And God called the dry land Earth; and the gathering together of the waters called he Seas:\n' +
//       'and God saw that it was good. \n',
//     nodeValue: 'And God called the dry land Earth; and the gathering together of the waters called he Seas:\n' +
//       'and God saw that it was good. \n',
//     length: 123,
//     parentNode: [Element],
//     previousSibling: [Element],
//     nextSibling: [Circular *12],
//     lineNumber: 34,
//     columnNumber: 116
//   }