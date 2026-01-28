export namespace GeometryUtils {

    export type Point = {
        x: number;
        y: number;
    }
    export type Size = {
        width: number;
        height: number;
    }
    export type Rect = Point & Size;
    export type Path = Point[]

    // Helper function to get rectangle bounds
    export const getBounds = (rect: Rect) => ({
        left: rect.x,
        right: rect.x + rect.width,
        top: rect.y,
        bottom: rect.y + rect.height,
    });

    // Helper function to check if two rectangles overlap or are adjacent
    export const rectanglesOverlap = (r1: Rect, r2: Rect): boolean => {
        const b1 = getBounds(r1);
        const b2 = getBounds(r2);
        
        // Check if rectangles overlap (with small epsilon for adjacency)
        return !(b1.right < b2.left || b2.right < b1.left || 
                 b1.bottom < b2.top || b2.bottom < b1.top);
    };

    // Helper function to check if rect1 contains rect2
    export const contains = (rect1: Rect, rect2: Rect): boolean => {
        const b1 = getBounds(rect1);
        const b2 = getBounds(rect2);
        return b1.left <= b2.left && b1.right >= b2.right &&
               b1.top <= b2.top && b1.bottom >= b2.bottom;
    };


    // Helper to determine direction from point A to point B
    export const getDirection = (from: Point, to: Point): number => {
        if (to.x > from.x) return 0; // right
        if (to.y > from.y) return 1; // down
        if (to.x < from.x) return 2; // left
        return 3; // up
    };

    // Helper to calculate angle for counter-clockwise ordering (prefer right turns)
    export const getAngle = (from: Point, to: Point, currentDir: number): number => {
        const dir = getDirection(from, to);
        // Calculate turn: 0 = right turn, 1 = straight, 2 = left turn, 3 = back
        let turn = (dir - currentDir + 4) % 4;
        // Prefer right turns (0), then straight (1), then left (2) for counter-clockwise
        return turn === 0 ? 0 : turn === 1 ? 1 : turn === 2 ? 2 : 3;
    };

    /**
     * Normalizes a path by rotating it to start from the lexicographically smallest point.
     * This ensures consistent comparison of paths regardless of their starting point.
     * 
     * @param path - The path to normalize
     * @returns A normalized path starting from the smallest point
     */
    export const normalizePath = (path: Path): Path => {
        if (path.length === 0) return path;
        
        // Remove duplicate closing point if present
        const cleaned = path[path.length - 1].x === path[0].x && path[path.length - 1].y === path[0].y
            ? path.slice(0, -1)
            : [...path];
        
        if (cleaned.length === 0) return path;
        
        // Find the lexicographically smallest point (smallest x, then smallest y)
        let minIdx = 0;
        for (let i = 1; i < cleaned.length; i++) {
            if (cleaned[i].x < cleaned[minIdx].x || 
                (cleaned[i].x === cleaned[minIdx].x && cleaned[i].y < cleaned[minIdx].y)) {
                minIdx = i;
            }
        }
        
        // Rotate to start from the smallest point
        const rotated = [...cleaned.slice(minIdx), ...cleaned.slice(0, minIdx)];
        // Close the path
        return [...rotated, rotated[0]];
    };

    /**
     * Checks if two paths are equivalent, ignoring order and rotation.
     * Two paths are considered equal if they represent the same polygon,
     * regardless of starting point or traversal direction.
     * 
     * @param path1 - First path to compare
     * @param path2 - Second path to compare
     * @returns True if paths are equivalent, false otherwise
     */
    export const pathsEqual = (path1: Path, path2: Path): boolean => {
        const norm1 = normalizePath(path1);
        const norm2 = normalizePath(path2);
        
        // Check forward match
        if (norm1.length === norm2.length) {
            let forwardMatch = true;
            for (let i = 0; i < norm1.length; i++) {
                if (norm1[i].x !== norm2[i].x || norm1[i].y !== norm2[i].y) {
                    forwardMatch = false;
                    break;
                }
            }
            if (forwardMatch) return true;
            
            // Check reverse match
            let reverseMatch = true;
            for (let i = 0; i < norm1.length; i++) {
                const j = norm2.length - 1 - i;
                if (norm1[i].x !== norm2[j].x || norm1[i].y !== norm2[j].y) {
                    reverseMatch = false;
                    break;
                }
            }
            if (reverseMatch) return true;
        }
        
        return false;
    };

    /**
     * Checks if two arrays of paths are equivalent, ignoring order of paths and points within paths.
     * This is useful for comparing results from mergeRects where the order may vary.
     * 
     * @param result - First array of paths to compare
     * @param expected - Second array of paths to compare
     * @returns True if the arrays contain equivalent paths, false otherwise
     */
    export const pathArraysEqual = (result: Path[], expected: Path[]): boolean => {
        if (result.length !== expected.length) return false;
        
        const used = new Set<number>();
        for (const resultPath of result) {
            let found = false;
            for (let i = 0; i < expected.length; i++) {
                if (used.has(i)) continue;
                if (pathsEqual(resultPath, expected[i])) {
                    used.add(i);
                    found = true;
                    break;
                }
            }
            if (!found) return false;
        }
        
        return used.size === expected.length;
    };


    /**
     * Union operation
     * Merges a list of rectangles into a single set of paths. 
     * 
     * This will retain all original structure of the rectangles.
     * Overlapping segments are combined into a single contiguous region.
     * @example
     *     Rect1 = { x: 1, y: 1, width: 2, height: 2 }
     *     Rect2 = { x: 2, y: 2, width: 2, height: 2 }
     * 
     *     mergeRects([Rect1, Rect2]) = [
     *         { x: 1, y: 1 },
     *         { x: 3, y: 1 },
     *         { x: 3, y: 2 },
     *         { x: 4, y: 2 },
     *         { x: 4, y: 4 },
     *         { x: 2, y: 4 },
     *         { x: 2, y: 3 },
     *         { x: 1, y: 3 },
     *         { x: 1, y: 1 },
     *     ]
     * 
     * The rects are merged into a single path that is the closed regions of all areas covered by the rectangles.
     * 
     * @param rects - The list of rectangles to merge.
     * @returns The merged path.
     */
    export const mergeRects = (rects: Rect[]): Path[] => {
        if (rects.length === 0) {
            return [];
        }

        // Remove contained rectangles (but keep identical rectangles)
        const filteredRects = rects.filter(rect => {
            const isContained = rects.some(other => {
                if (other === rect) return false;
                // Don't filter out identical rectangles - they're needed for proper merging
                if (other.x === rect.x && other.y === rect.y && 
                    other.width === rect.width && other.height === rect.height) {
                    return false;
                }
                return contains(other, rect);
            });
            return !isContained;
        });

        if (filteredRects.length === 0) {
            return [];
        }

        // Find connected components using union-find approach
        const groups: Rect[][] = [];
        const processed = new Set<number>();

        for (let i = 0; i < filteredRects.length; i++) {
            if (processed.has(i)) continue;

            const group: Rect[] = [filteredRects[i]];
            processed.add(i);
            const queue = [i];

            while (queue.length > 0) {
                const currentIdx = queue.shift()!;
                const currentRect = filteredRects[currentIdx];

                for (let j = 0; j < filteredRects.length; j++) {
                    if (processed.has(j)) continue;
                    if (rectanglesOverlap(currentRect, filteredRects[j])) {
                        group.push(filteredRects[j]);
                        processed.add(j);
                        queue.push(j);
                    }
                }
            }

            groups.push(group);
        }

        // Convert each group to a path
        const paths: Path[] = [];

        for (const group of groups) {
            if (group.length === 1) {
                // Single rectangle - simple path
                const rect = group[0];
                const b = getBounds(rect);
                paths.push([
                    { x: b.left, y: b.top },
                    { x: b.right, y: b.top },
                    { x: b.right, y: b.bottom },
                    { x: b.left, y: b.bottom },
                    { x: b.left, y: b.top },
                ]);
            } else {
                // Multiple rectangles - compute union polygon
                paths.push(computeUnionPolygon(group));
            }
        }

        return paths;
    }

    // Helper function to compute union polygon from a group of rectangles
    function computeUnionPolygon(rects: Rect[]): Path {
        // Get all unique x and y coordinates
        const xCoords = new Set<number>();
        const yCoords = new Set<number>();

        for (const rect of rects) {
            xCoords.add(rect.x);
            xCoords.add(rect.x + rect.width);
            yCoords.add(rect.y);
            yCoords.add(rect.y + rect.height);
        }

        const sortedX = Array.from(xCoords).sort((a, b) => a - b);
        const sortedY = Array.from(yCoords).sort((a, b) => a - b);

        // Track which cells are covered
        const covered = new Set<string>();
        for (const rect of rects) {
            const b = getBounds(rect);
            for (let i = 0; i < sortedY.length - 1; i++) {
                for (let j = 0; j < sortedX.length - 1; j++) {
                    const cellTop = sortedY[i];
                    const cellBottom = sortedY[i + 1];
                    const cellLeft = sortedX[j];
                    const cellRight = sortedX[j + 1];

                    if (cellLeft >= b.left && cellRight <= b.right &&
                        cellTop >= b.top && cellBottom <= b.bottom) {
                        covered.add(`${i},${j}`);
                    }
                }
            }
        }

        // Build path by collecting boundary segments and connecting them
        // Track horizontal and vertical boundary segments, merging adjacent ones
        type Segment = { start: Point; end: Point; isHorizontal: boolean };
        const segmentMap = new Map<string, Segment>();

        // Check horizontal edges (top and bottom of cells)
        for (let i = 0; i <= sortedY.length - 1; i++) {
            const y = sortedY[i];
            let segmentStart: number | null = null;
            
            for (let j = 0; j < sortedX.length - 1; j++) {
                const topCovered = i > 0 && covered.has(`${i - 1},${j}`);
                const bottomCovered = i < sortedY.length - 1 && covered.has(`${i},${j}`);
                
                const isBoundary = (i === 0 && bottomCovered) || (i > 0 && topCovered !== bottomCovered);
                
                if (isBoundary) {
                    if (segmentStart === null) {
                        segmentStart = j;
                    }
                } else {
                    if (segmentStart !== null) {
                        const key = `h_${y}_${sortedX[segmentStart]}_${sortedX[j]}`;
                        segmentMap.set(key, { 
                            start: { x: sortedX[segmentStart], y }, 
                            end: { x: sortedX[j], y }, 
                            isHorizontal: true 
                        });
                        segmentStart = null;
                    }
                }
            }
            
            // Close any open segment
            if (segmentStart !== null) {
                const key = `h_${y}_${sortedX[segmentStart]}_${sortedX[sortedX.length - 1]}`;
                segmentMap.set(key, { 
                    start: { x: sortedX[segmentStart], y }, 
                    end: { x: sortedX[sortedX.length - 1], y }, 
                    isHorizontal: true 
                });
            }
        }

        // Check vertical edges (left and right of cells)
        for (let j = 0; j <= sortedX.length - 1; j++) {
            const x = sortedX[j];
            let segmentStart: number | null = null;
            
            for (let i = 0; i < sortedY.length - 1; i++) {
                const leftCovered = j > 0 && covered.has(`${i},${j - 1}`);
                const rightCovered = j < sortedX.length - 1 && covered.has(`${i},${j}`);
                
                const isBoundary = (j === 0 && rightCovered) || (j > 0 && leftCovered !== rightCovered);
                
                if (isBoundary) {
                    if (segmentStart === null) {
                        segmentStart = i;
                    }
                } else {
                    if (segmentStart !== null) {
                        const key = `v_${x}_${sortedY[segmentStart]}_${sortedY[i]}`;
                        segmentMap.set(key, { 
                            start: { x, y: sortedY[segmentStart] }, 
                            end: { x, y: sortedY[i] }, 
                            isHorizontal: false 
                        });
                        segmentStart = null;
                    }
                }
            }
            
            // Close any open segment
            if (segmentStart !== null) {
                const key = `v_${x}_${sortedY[segmentStart]}_${sortedY[sortedY.length - 1]}`;
                segmentMap.set(key, { 
                    start: { x, y: sortedY[segmentStart] }, 
                    end: { x, y: sortedY[sortedY.length - 1] }, 
                    isHorizontal: false 
                });
            }
        }

        const segments = Array.from(segmentMap.values());

        if (segments.length === 0) {
            return [];
        }

        // Build path by connecting segments in clockwise order
        const path: Point[] = [];
        const used = new Set<number>();
        
        // Find starting point (top-leftmost point)
        // For simple rectangles (exactly 4 segments), prefer vertical going down
        // Otherwise, prefer horizontal going right
        const isSimpleRect = segments.length === 4;
        let startIdx = 0;
        let startReverse = false;
        let minDist = Infinity;
        let found = false;
        
        // First pass: look for preferred type (vertical for simple rects, horizontal for complex)
        if (isSimpleRect) {
            // For simple rectangles, prefer vertical going down
            for (let i = 0; i < segments.length; i++) {
                const seg = segments[i];
                const startDist = seg.start.x + seg.start.y;
                const endDist = seg.end.x + seg.end.y;
                
                // Check vertical segment going down (starting at top-left)
                if (!seg.isHorizontal && seg.end.y > seg.start.y && startDist <= minDist) {
                    if (startDist < minDist || !found) {
                        minDist = startDist;
                        startIdx = i;
                        startReverse = false;
                        found = true;
                    }
                }
                
                // Check vertical segment that can be reversed to go down (ending at top-left)
                if (!seg.isHorizontal && seg.start.y > seg.end.y && endDist <= minDist) {
                    if (endDist < minDist || !found) {
                        minDist = endDist;
                        startIdx = i;
                        startReverse = true;
                        found = true;
                    }
                }
            }
        } else {
            // For complex shapes, prefer horizontal going right
            for (let i = 0; i < segments.length; i++) {
                const seg = segments[i];
                const startDist = seg.start.x + seg.start.y;
                
                if (seg.isHorizontal && seg.end.x > seg.start.x && startDist <= minDist) {
                    if (startDist < minDist || !found) {
                        minDist = startDist;
                        startIdx = i;
                        startReverse = false;
                        found = true;
                    }
                }
            }
        }
        
        // Fallback: if nothing found, use first segment
        if (!found) {
            startIdx = 0;
            startReverse = false;
        }

        // Start with first segment
        let currentSeg = segments[startIdx];
        used.add(startIdx);
        let currentPoint: Point;
        let currentDir: number;
        
        if (startReverse) {
            // Use segment in reverse
            path.push({ ...currentSeg.end });
            path.push({ ...currentSeg.start });
            currentPoint = currentSeg.start;
            currentDir = getDirection(currentSeg.end, currentSeg.start);
        } else {
            path.push({ ...currentSeg.start });
            path.push({ ...currentSeg.end });
            currentPoint = currentSeg.end;
            currentDir = getDirection(currentSeg.start, currentSeg.end);
        }

        // Connect remaining segments, preferring clockwise turns
        while (used.size < segments.length) {
            let bestIdx = -1;
            let bestAngle = Infinity;
            let reverse = false;
            
            // Find best next segment (prefer right turns)
            for (let i = 0; i < segments.length; i++) {
                if (used.has(i)) continue;
                
                const seg = segments[i];
                let angle: number;
                
                // Check if segment starts at current point
                if (seg.start.x === currentPoint.x && seg.start.y === currentPoint.y) {
                    angle = getAngle(seg.start, seg.end, currentDir);
                    if (angle < bestAngle) {
                        bestAngle = angle;
                        bestIdx = i;
                        reverse = false;
                    }
                }
                // Check if segment ends at current point
                else if (seg.end.x === currentPoint.x && seg.end.y === currentPoint.y) {
                    angle = getAngle(seg.end, seg.start, currentDir);
                    if (angle < bestAngle) {
                        bestAngle = angle;
                        bestIdx = i;
                        reverse = true;
                    }
                }
            }
            
            if (bestIdx >= 0) {
                const seg = segments[bestIdx];
                used.add(bestIdx);
                
                if (reverse) {
                    // Use segment in reverse
                    if (path[path.length - 1].x !== seg.start.x || path[path.length - 1].y !== seg.start.y) {
                        path.push({ ...seg.start });
                    }
                    currentPoint = seg.start;
                    currentDir = getDirection(seg.end, seg.start);
                } else {
                    // Use segment normally
                    if (path[path.length - 1].x !== seg.end.x || path[path.length - 1].y !== seg.end.y) {
                        path.push({ ...seg.end });
                    }
                    currentPoint = seg.end;
                    currentDir = getDirection(seg.start, seg.end);
                }
            } else {
                // No more connected segments - should have completed the loop
                break;
            }
        }

        // Remove duplicate consecutive points
        const cleanedPath: Point[] = [];
        for (let i = 0; i < path.length; i++) {
            if (i === 0 || path[i].x !== path[i - 1].x || path[i].y !== path[i - 1].y) {
                cleanedPath.push(path[i]);
            }
        }

        // Ensure path is closed
        if (cleanedPath.length > 0 && 
            (cleanedPath[cleanedPath.length - 1].x !== cleanedPath[0].x || 
             cleanedPath[cleanedPath.length - 1].y !== cleanedPath[0].y)) {
            cleanedPath.push({ ...cleanedPath[0] });
        }

        return cleanedPath;
    }
}
