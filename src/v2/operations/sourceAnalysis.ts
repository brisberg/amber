/**
 * Utility package which will evaluate a Source for harvesting.
 *
 * Returns a SourceAnalysis object with designates the best location for a
 * Container, Link, and all viable harvesting positions.
 */

import {Point} from 'v2/types';

export interface SourceAnalysis {
  // Array of harvesting positions in order of preference
  positions: Point[];
  sourceID: Id<Source>;
  maxHarvesters: number;
}

/**
 * Analyzes a source and returns a report containing information relevent for
 * setting up a harvesting missions for the source.
 */
export function analyzeSourceForHarvesting(
    base: RoomPosition, source: Source): SourceAnalysis {
  const analysis: SourceAnalysis = {
    positions: [],
    maxHarvesters: 0,
    sourceID: source.id,
  };
  const room = source.room;

  // Count pathable spaces near the source
  const maxtrix = room.lookForAtArea(
      LOOK_TERRAIN, source.pos.y - 1, source.pos.x - 1, source.pos.y + 1,
      source.pos.x + 1, true);
  const openPositions = maxtrix.filter((result) => {
    return result.terrain === 'plain' || result.terrain === 'swamp';
  });
  analysis.maxHarvesters = openPositions.length;
  // TODO: Filter this list to avoid overly long paths (such as a source
  // accessable across a wall)

  // Determine best container location
  const path = room.findPath(base, source.pos, {
    ignoreCreeps: true,
    ignoreRoads: true,
    swampCost: 1,
  });

  // Place container on the path just before Source
  const end = path[path.length - 2];
  analysis.positions.push([end.x, end.y]);

  // Determine secondary harvest positions
  const secondaries = openPositions.filter((result) => {
    if (result.x === end.x && result.y === end.y) return false;

    const range = Math.max(
        Math.abs(source.pos.x - result.x),
        Math.abs(source.pos.y - result.y),
    );

    return range === 1;
  });
  const secondPos: Point[] = secondaries.map((result) => [result.x, result.y]);
  analysis.positions.push(...secondPos);

  return analysis;
}
