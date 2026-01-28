
import * as CFISelectionUtils from "./utils";

/**
 * A comprehensive CFI (Canonical Fragment Identifier) class for EPUB navigation.
 * Parses CFI strings into structured data and provides comparison, range, and utility operations.
 */
export class CFI {
    private _value: string;
    private _error: string | null = null;
    private _isRange = false;
    private _opfIndex = 0;
    private _spineIndex = 0;
    private _baseSteps: number[] = [];
    private _baseOffset: number | null = null;
    private _rangeStartSteps: number[] = [];
    private _rangeStartOffset: number | null = null;
    private _rangeEndSteps: number[] = [];
    private _rangeEndOffset: number | null = null;
  
    constructor(cfiStr: string) {
      this._value = cfiStr;
      this._parseCFI(cfiStr);
    }
  
    private _parseCFI(cfiStr: string): void {
      // Initialize defaults in case parse fails
      this._isRange = false;
      this._opfIndex = 0;
      this._spineIndex = 0;
      this._baseSteps = [];
      this._baseOffset = null;
      this._rangeStartSteps = [];
      this._rangeStartOffset = null;
      this._rangeEndSteps = [];
      this._rangeEndOffset = null;
  
      // Split by commas to detect range
      const parts = cfiStr.split(',');
      let mainPart: string;
      let startPart: string | null = null;
      let endPart: string | null = null;
  
      if (parts.length === 3) {
        this._isRange = true;
        mainPart = parts[0] + ')';
        startPart = parts[1];
        endPart = parts[2].slice(0, -1); // Remove closing parenthesis
      } else if (parts.length === 1) {
        this._isRange = false;
        mainPart = parts[0];
      } else {
        this._error = `Invalid CFI format: expected 1 or 3 segments, got ${parts.length}. CFI=${cfiStr}`;
        return;
      }
  
      const pattern = /^epubcfi\(\/(\d+)\/(-?\d+)(.*?)!(.*)\)$/;
      const match = mainPart.match(pattern);
      if (!match) {
        this._error = `Could not parse the main part: ${mainPart}`;
        return;
      }
  
      try {
        this._opfIndex = parseInt(match[1], 10);
        this._spineIndex = parseInt(match[2], 10);
      } catch (error) {
        this._error = `OPF or spine index not an integer: ${error}`;
        return;
      }
  
      // The base content path after the '!'
      let contentStr = match[4];
      // Remove [labels] for simplicity
      contentStr = contentStr.replace(/\[.*?\]/g, '');
      [this._baseSteps, this._baseOffset] = CFI._parseFullPath(contentStr);
  
      // If it's a range, parse the start/end segments
      if (this._isRange && startPart && endPart) {
        startPart = startPart.replace(/\[.*?\]/g, '');
        endPart = endPart.replace(/\[.*?\]/g, '');
        [this._rangeStartSteps, this._rangeStartOffset] =
          CFI._parseFullPath(startPart);
        [this._rangeEndSteps, this._rangeEndOffset] = CFI._parseFullPath(endPart);
      }
    }
  
    private static _parseFullPath(
      pathStr: string
    ): [number[], number | null] {
      /**
       * Parse something like '/4/2/1:100' into (steps=[4,2,1], offset=100).
       * If there's no offset, offset=null.
       * If the string is empty or '/', returns ([], null).
       */
      if (!pathStr || pathStr === '/') {
        return [[], null];
      }
  
      const segments = pathStr.split('/').filter((seg) => seg);
      const steps: number[] = [];
      let offset: number | null = null;
  
      for (const seg of segments) {
        // Check if we have 'N:Offset'
        const match = seg.match(/^(\d+):(\d+)$/);
        if (match) {
          const stepVal = parseInt(match[1], 10);
          const offVal = parseInt(match[2], 10);
          steps.push(stepVal);
          offset = offVal;
        } else {
          const colonSplit = seg.split(':');
          if (colonSplit.length === 2) {
            const stepVal = parseInt(colonSplit[0], 10);
            const offVal = parseInt(colonSplit[1], 10);
            steps.push(stepVal);
            offset = offVal;
          } else {
            const stepVal = parseInt(seg, 10);
            steps.push(stepVal);
          }
        }
      }
  
      return [steps, offset];
    }
  
    // Properties
    get isValid(): boolean {
      return !this._error;
    }
  
    get error(): string | null {
      return this._error;
    }
  
    get isRange(): boolean {
      return this._isRange;
    }
  
    get opfIndex(): number {
      return this._opfIndex;
    }
  
    get spineIndex(): number {
      return this._spineIndex;
    }
  
    get spineIndexRaw(): number {
      return this._spineIndex / 2 - 1;
    }
  
    get baseSteps(): number[] {
      return [...this._baseSteps]; // Return copy to prevent mutation
    }
  
    get baseOffset(): number | null {
      return this._baseOffset;
    }
  
    get rangeStartSteps(): number[] {
      return [...this._rangeStartSteps];
    }
  
    get rangeStartOffset(): number | null {
      return this._rangeStartOffset;
    }
  
    get rangeEndSteps(): number[] {
      return [...this._rangeEndSteps];
    }
  
    get rangeEndOffset(): number | null {
      return this._rangeEndOffset;
    }
  
    get pureCFI(): string {
      /**
       * Return the CFI string without 'epubcfi(...)' wrapping.
       * Example: '/6/8!/4/2/1:100' instead of 'epubcfi(/6/8!/4/2/1:100)'.
       */
      const s = this._value;
      if (s.startsWith('epubcfi(') && s.endsWith(')')) {
        return s.slice(8, -1); // Remove 'epubcfi(' and ')'
      }
      return s;
    }
  
    get withoutIds(): CFI {
      /**
       * Return the CFI string without ID fields (square brackets).
       * Example: 'epubcfi(/6/8[id1]!/4[id2]/2/1:100)' becomes 'epubcfi(/6/8!/4/2/1:100)'
       */
      return new CFI(this._value.replace(/\[.*?\]/g, ''));
    }
  
    get rangeStart(): CFI {
      /**
       * Return the start CFI of the range.
       * Example: For epubcfi(/6/8!/4,/2/1:100,/3/1:50) returns CFI("epubcfi(/6/8!/4/2/1:100)")
       * If not a range, returns the CFI itself.
       */
      if (this._isRange) {
        const parts = this._value.split(',');
        return new CFI(parts[0] + parts[1] + ')');
      }
      return this;
    }
  
    get rangeEnd(): CFI {
      /**
       * Return the end CFI of the range.
       * Example: For epubcfi(/6/8!/4,/2/1:100,/3/1:50) returns CFI("epubcfi(/6/8!/4/3/1:50)")
       * If not a range, returns the CFI itself.
       */
      if (this._isRange) {
        const parts = this._value.split(',');
        return new CFI(parts[0] + parts[2]);
      }
      return this;
    }
  
    private static _constructCFI(
      steps: number[],
      offset: number | null
    ): string {
      /**
       * Construct the CFI content path from steps and offset.
       */
      let path = '/' + steps.join('/');
      if (offset !== null) {
        path += `:${offset}`;
      }
      return path;
    }
  
    private _rebuildCFI(
      newBaseSteps: number[],
      newBaseOffset: number | null
    ): string {
      /**
       * Rebuilds the full CFI string using the new base steps.
       */
      const baseContent = CFI._constructCFI(newBaseSteps, newBaseOffset);
      const mainPart = `/${this._opfIndex}/${this._spineIndex}!${baseContent}`;
      if (!this._isRange) {
        return `epubcfi(${mainPart})`;
      }
      // For ranges, this is more complex - not fully implemented in original
      return this._value;
    }
  
    rebuild() {
      return this._rebuildCFI(this._baseSteps, this._baseOffset);
    }
  
    get stepForward(): CFI | null {
      /**
       * Returns a new CFI with the last step of the base path increased by 2.
       */
      if (this._isRange) {
        return null;
      }
  
      if (this._baseSteps.length === 0) {
        return this;
      }
  
      const newBaseSteps = [...this._baseSteps];
      newBaseSteps[newBaseSteps.length - 1] += 2;
      const newCfiStr = this._rebuildCFI(newBaseSteps, this._baseOffset);
      return new CFI(newCfiStr);
    }
  
    get stepBackward(): CFI | null {
      /**
       * Returns a new CFI with the last step of the base path decreased by 2.
       * If the resulting step would be lower than the minimum allowed (1 for odd, 2 for even),
       * the current CFI is returned unchanged.
       */
      if (this._isRange) {
        return null;
      }
  
      if (this._baseSteps.length === 0) {
        return this;
      }
  
      const newBaseSteps = [...this._baseSteps];
      const lastStep = newBaseSteps[newBaseSteps.length - 1];
      const minAllowed = lastStep % 2 === 1 ? 1 : 2;
  
      if (lastStep - 2 < minAllowed) {
        return this;
      }
  
      newBaseSteps[newBaseSteps.length - 1] = lastStep - 2;
      const newCfiStr = this._rebuildCFI(newBaseSteps, this._baseOffset);
      return new CFI(newCfiStr);
    }
  
    get stepRemove(): CFI | null {
      /**
       * Returns a new CFI with the last step of the base path removed.
       * Also resets the base offset to null.
       * If there is no step to remove, the original CFI is returned.
       */
      if (this._isRange) {
        return null;
      }
  
      if (this._baseSteps.length === 0) {
        return this;
      }
  
      const newBaseSteps = [...this._baseSteps];
      newBaseSteps.pop();
      const newCfiStr = this._rebuildCFI(newBaseSteps, null);
      return new CFI(newCfiStr);
    }
  
    // Comparison methods
    equals(other: CFI | string): boolean {
      const otherCFI = typeof other === 'string' ? new CFI(other) : other;
  
      if (this._value === otherCFI._value) {
        return true;
      }
  
      // If one invalid, the other valid => not equal
      if (!this.isValid || !otherCFI.isValid) {
        return false;
      }
  
      return (
        this._opfIndex === otherCFI._opfIndex &&
        this._spineIndex === otherCFI._spineIndex &&
        this._comparePositions(
          this._getStartPosition(),
          otherCFI._getStartPosition()
        ) === 0 &&
        this._comparePositions(
          this._getEndPosition(),
          otherCFI._getEndPosition()
        ) === 0
      );
    }
  
    lessThan(other: CFI | string): boolean {
      const otherCFI = typeof other === 'string' ? new CFI(other) : other;
  
      // If one invalid, the other valid => invalid < valid
      if (!this.isValid && otherCFI.isValid) {
        return true;
      }
      if (this.isValid && !otherCFI.isValid) {
        return false;
      }
      if (!this.isValid && !otherCFI.isValid) {
        return this._value < otherCFI._value;
      }
  
      if (this._opfIndex !== otherCFI._opfIndex) {
        return this._opfIndex < otherCFI._opfIndex;
      }
  
      if (this._spineIndex !== otherCFI._spineIndex) {
        return this._spineIndex < otherCFI._spineIndex;
      }
  
      const startA = this._getStartPosition();
      const startB = otherCFI._getStartPosition();
      const cmpStart = this._comparePositions(startA, startB);
      if (cmpStart < 0) {
        return true;
      } else if (cmpStart > 0) {
        return false;
      }
  
      const endA = this._getEndPosition();
      const endB = otherCFI._getEndPosition();
      const cmpEnd = this._comparePositions(endA, endB);
      return cmpEnd < 0;
    }
  
    greaterThan(other: CFI | string): boolean {
      const otherCFI = typeof other === 'string' ? new CFI(other) : other;
      return !this.lessThan(otherCFI) && !this.equals(otherCFI);
    }
  
    private _getStartPosition(): [number[], number | null] {
      /**
       * Return a tuple [steps, offset] representing the "start" of this CFI.
       * If isRange, we combine baseSteps + rangeStartSteps, offset=rangeStartOffset.
       * Otherwise, steps=baseSteps, offset=baseOffset.
       */
      if (!this._isRange) {
        return [this._baseSteps, this._baseOffset];
      } else {
        const mergedSteps = [...this._baseSteps, ...this._rangeStartSteps];
        return [mergedSteps, this._rangeStartOffset];
      }
    }
  
    private _getEndPosition(): [number[], number | null] {
      /**
       * Return a tuple [steps, offset] representing the "end" of this CFI.
       * If isRange, we combine baseSteps + rangeEndSteps, offset=rangeEndOffset.
       * Otherwise, same as start.
       */
      if (!this._isRange) {
        return [this._baseSteps, this._baseOffset];
      } else {
        const mergedSteps = [...this._baseSteps, ...this._rangeEndSteps];
        return [mergedSteps, this._rangeEndOffset];
      }
    }
  
    private _comparePositions(
      posA: [number[], number | null],
      posB: [number[], number | null]
    ): number {
      /**
       * Compare two positions [stepsA, offsetA] vs [stepsB, offsetB].
       * Return -1 if posA < posB, 0 if equal, +1 if posA > posB
       */
      const [stepsA, offA] = posA;
      const [stepsB, offB] = posB;
  
      const minLength = Math.min(stepsA.length, stepsB.length);
      for (let i = 0; i < minLength; i++) {
        if (stepsA[i] < stepsB[i]) {
          return -1;
        } else if (stepsA[i] > stepsB[i]) {
          return 1;
        }
      }
  
      if (stepsA.length < stepsB.length) {
        return -1;
      } else if (stepsA.length > stepsB.length) {
        return 1;
      }
  
      // Steps are equal, compare offsets
      if (offA === null && offB !== null) {
        return -1;
      }
      if (offA !== null && offB === null) {
        return 1;
      }
      if (offA !== null && offB !== null) {
        if (offA < offB) {
          return -1;
        } else if (offA > offB) {
          return 1;
        }
      }
      return 0;
    }
  
    // Range-related methods
    isWithinRange(other: CFI): boolean {
      /**
       * Check if this CFI (single or range) is fully inside `other`,
       * assuming `other` is a range. If `other` is not a range,
       * we'll treat it as a single position (start=end).
       */
      if (!this.isValid || !other.isValid) {
        return false;
      }
  
      const startA = this._getStartPosition();
      const endA = this._getEndPosition();
      const startB = other._getStartPosition();
      const endB = other._getEndPosition();
  
      // self.start >= other.start
      if (this._comparePositions(startA, startB) < 0) {
        return false;
      }
      // self.end <= other.end
      if (this._comparePositions(endA, endB) > 0) {
        return false;
      }
  
      return true;
    }
  
    overlapsRange(other: CFI): boolean {
      /**
       * Check if two CFIs overlap in reading order.
       * Overlap occurs if: (self.start <= other.end) AND (self.end >= other.start)
       */
      if (!this.isValid || !other.isValid) {
        return false;
      }
  
      const startA = this._getStartPosition();
      const endA = this._getEndPosition();
      const startB = other._getStartPosition();
      const endB = other._getEndPosition();
  
      // (A.start <= B.end) and (A.end >= B.start)
      const cmpAstartBend = this._comparePositions(startA, endB);
      const cmpAendBstart = this._comparePositions(endA, startB);
  
      return cmpAstartBend <= 0 && cmpAendBstart >= 0;
    }
  
    // Other utility methods
    addStep(step: number): CFI | null {
      /**
       * Adds a new step to the CFI path.
       * Inserts the given step as the last step before the offset (if present).
       */
      const pattern = /(.*\/)(\d+)((!|:\d+))?(\)?)?$/;
      const match = this._value.match(pattern);
      if (match) {
        const before = match[1];
        const lastStep = match[2];
        const separator = match[3] || '';
        const closing = match[5] || '';
  
        if (separator.startsWith(':')) {
          // Offset exists: insert new step before the offset
          return new CFI(`${before}${lastStep}/${step}${separator}${closing}`);
        } else if (separator === '!') {
          // Separator is exclamation mark: append new step after the "!"
          return new CFI(`${before}${lastStep}${separator}/${step}${closing}`);
        } else {
          // No separator exists: just append the new step
          return new CFI(`${before}${lastStep}/${step}${closing}`);
        }
      }
      return null;
    }
  
    isDescendantOf(parent: CFI): boolean {
      /**
       * Check if the current CFI is a descendant of the given parent CFI.
       */
      if (!this.isValid || !parent.isValid) {
        return false;
      }
  
      if (
        this._opfIndex !== parent._opfIndex ||
        this._spineIndex !== parent._spineIndex
      ) {
        return false;
      }
  
      const parentSteps = parent._baseSteps;
      const childSteps = this._baseSteps;
  
      if (childSteps.length < parentSteps.length) {
        return false;
      }
  
      // Check if parent steps are a prefix of child steps
      for (let i = 0; i < parentSteps.length; i++) {
        if (childSteps[i] !== parentSteps[i]) {
          return false;
        }
      }
  
      if (childSteps.length > parentSteps.length) {
        return true;
      }
  
      if (parent._baseOffset === null && this._baseOffset !== null) {
        return true;
      }
  
      return false;
    }
  
    toString(): string {
      return this._value;
    }
  
    valueOf(): string {
      return this._value;
    }


    toSelectorAddress(omitBody = true): CFISelectionUtils.FullAddress {
      const steps = omitBody ? this._baseSteps.slice(1) : this._baseSteps;
      const offset = this._baseOffset;
      const address : CFISelectionUtils.FullAddress = [...steps];
      if (offset !== null) {
        address.push(`:${offset}`);
      }
      return address;
    }

    toSelectorAddressRange(omitBody = true) {
      const baseSteps = omitBody ? this._baseSteps.slice(1) : this._baseSteps;
      const startSteps = this._rangeStartSteps;
      const endSteps = this._rangeEndSteps;
      const startOffset = this._rangeStartOffset;
      const endOffset = this._rangeEndOffset;
      const startAddr : CFISelectionUtils.FullAddress = [...baseSteps, ...startSteps];
      if (startOffset !== null) {
        startAddr.push(`:${startOffset}`);
      }
      const endAddr : CFISelectionUtils.FullAddress = [...baseSteps, ...endSteps];
      if (endOffset !== null) {
        endAddr.push(`:${endOffset}`);
      }
      return [startAddr, endAddr];
    }
  
    
    static build(params: BuildParams): CFI {
      const { spineIndex, opfIndex = 6, steps = [], offset = null } = params;
      return new CFI(`epubcfi(/${opfIndex}/${spineIndex}!/${steps.join('/')}${offset ? ':' + offset : ''})`);
    }
  
    static fromString(cfiStr: string): CFI {
      return new CFI(cfiStr);
    }
  
    static fromRange(start: string, end: string): CFI | null {
      const startCfi = new CFI(start);
      const endCfi = new CFI(end);
      if (startCfi.isRange || endCfi.isRange) {
        return null;
      }
  
      if (startCfi.opfIndex !== endCfi.opfIndex) {
        return null;
      }
  
      if (startCfi.spineIndex !== endCfi.spineIndex) {
        return null;
      }
  
      const spineIndex = startCfi.spineIndex;
      const opfIndex = startCfi.opfIndex;
  
      const startSteps = startCfi.baseSteps;
      const endSteps = endCfi.baseSteps;
      const commonSteps: number[] = [];
      for (let i = 0; i < Math.min(startSteps.length, endSteps.length) - 1; i++) {
        if (startSteps[i] === endSteps[i]) {
          commonSteps.push(startSteps[i]);
        } else {
          break;
        }
      }
  
      const startStepsDiff = startSteps.slice(commonSteps.length);
      const endStepsDiff = endSteps.slice(commonSteps.length);
  
      const commonPath = commonSteps.join('/');
      const startPath =
        startStepsDiff.join('/') + ':' + (startCfi.baseOffset ?? 0);
      const endPath = endStepsDiff.join('/') + ':' + (endCfi.baseOffset ?? 0);
  
      const cfiStr = `epubcfi(/${opfIndex}/${spineIndex}!/${commonPath},/${startPath},/${endPath})`;
      return new CFI(cfiStr);
    }
}
  
interface BuildParams {
  spineIndex: number
  opfIndex?: number
  steps?: number[]
  offset?: number
}