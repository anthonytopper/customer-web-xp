


export type Range<T = unknown> = [T, T];

// -1 if a < b, 0 if a = b, 1 if a > b, null if a and b are not comparable
export type Compare<T = unknown> = (a: T, b: T) => number | null;

export class RangeOperations<T> {

    private _compare: Compare<T>
    constructor(compare: Compare<T>) {
        this._compare = compare;
    }

    overlaps = (range1: Range<T>, range2: Range<T>) : boolean | null => {
        const [start1, end1] = range1;
        const [start2, end2] = range2;

        const order1 = this._compare(start1, end1);
        if (order1 === null) {
            return null;
        }
        const low1 = order1 <= 0 ? start1 : end1;
        const high1 = order1 <= 0 ? end1 : start1;

        const order2 = this._compare(start2, end2);
        if (order2 === null) {
            return null;
        }
        const low2 = order2 <= 0 ? start2 : end2;
        const high2 = order2 <= 0 ? end2 : start2;

        const cmp1 = this._compare(high1, low2);
        if (cmp1 === null) {
            return null;
        }
        if (cmp1 === -1) {
            return false;
        }

        const cmp2 = this._compare(high2, low1);
        if (cmp2 === null) {
            return null;
        }
        if (cmp2 === -1) {
            return false;
        }

        return true;
    }

    disjoint = (range1: Range<T>, range2: Range<T>) : boolean | null => 
        !this.overlaps(range1, range2)

    // outer = (_ranges: Range<T>[]) : Range<T> | null => {
    //     throw new Error('Not implemented');
    // }

    // union = (ranges: Range<T>[]) : Range<T>[] => {
    //     throw new Error('Not implemented');
    // }

    subtract = (range: Range<T>, toRemove: Range<T>): Range<T>[] => {
        const [start1, end1] = range;
        const [start2, end2] = toRemove;

        // Normalize range
        const order1 = this._compare(start1, end1);
        if (order1 === null) {
            // Cannot normalize, return original
            return [range];
        }
        const low1 = order1 <= 0 ? start1 : end1;
        const high1 = order1 <= 0 ? end1 : start1;

        // Normalize toRemove
        const order2 = this._compare(start2, end2);
        if (order2 === null) {
            // Cannot normalize toRemove, return original
            return [range];
        }
        const low2 = order2 <= 0 ? start2 : end2;
        const high2 = order2 <= 0 ? end2 : start2;

        // Check if they overlap
        const overlapsResult = this.overlaps([low1, high1], [low2, high2]);
        if (overlapsResult === null) {
            // Cannot determine overlap, return original
            return [range];
        }
        if (!overlapsResult) {
            // No overlap, return original range
            return [[low1, high1]];
        }

        // They overlap - determine what parts remain
        const result: Range<T>[] = [];

        // Check if there's a part before toRemove
        const cmpLow1Low2 = this._compare(low1, low2);
        if (cmpLow1Low2 === null) {
            // Cannot compare, return original
            return [range];
        }
        if (cmpLow1Low2 < 0) {
            // There's a part before toRemove
            const cmpLow1High2 = this._compare(low1, high2);
            if (cmpLow1High2 !== null && cmpLow1High2 < 0) {
                // Use the minimum of high1 and low2 as the end of the first part
                const cmpLow2High1 = this._compare(low2, high1);
                if (cmpLow2High1 !== null) {
                    if (cmpLow2High1 <= 0) {
                        result.push([low1, low2]);
                    } else {
                        // toRemove starts after range ends, shouldn't happen if overlapping
                        return [[low1, high1]];
                    }
                } else {
                    return [range];
                }
            }
        }

        // Check if there's a part after toRemove
        const cmpHigh2High1 = this._compare(high2, high1);
        if (cmpHigh2High1 === null) {
            // Cannot compare, return what we have so far or original
            return result.length > 0 ? result : [range];
        }
        if (cmpHigh2High1 < 0) {
            // There's a part after toRemove
            result.push([high2, high1]);
        }

        return result;
    }
}