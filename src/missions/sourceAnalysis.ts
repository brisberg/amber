/**
 * Utility package which will evaluate a Source for harvesting.
 *
 * Returns a SourceAnalysis object with designates the best location for a
 * Container and all, viable harvesting positions.
 */

export interface SourceAnalysis {
  containerID: Id<StructureContainer|ConstructionSite<STRUCTURE_CONTAINER>>|
      null;
  containerPos: number[];  // [x, y]
  sourceID: Id<Source>;
  maxHarvesters: number;
}

/**
 * Analyzes a source and returns a report containing information relevent for
 * setting up a harvesting missions for the source.
 */
export function analyzeSourceForHarvesting(source: Source): SourceAnalysis {
  const analysis: SourceAnalysis = {
    containerID: null,
    containerPos: [0, 0],
    maxHarvesters: 0,
    sourceID: source.id,
  };
  const room = source.room;

  // Count pathable spaces near the source
  const maxtrix = room.lookForAtArea(
      LOOK_TERRAIN, source.pos.y - 1, source.pos.x - 1, source.pos.y + 1,
      source.pos.x + 1, true);
  analysis.maxHarvesters =
      maxtrix.filter((result) => result.terrain === 'plain').length;
  // TODO: Filter this list to avoid overly long paths (such as a source
  // accessable across a wall)

  // Determine best container location by first looking to reuse an existing
  // one, otherwise use the best path

  // Locate an existing Container or Construction site
  const sites = room.lookForAtArea(
      LOOK_CONSTRUCTION_SITES, source.pos.y - 1, source.pos.x - 1,
      source.pos.y + 1, source.pos.x + 1, true);
  if (sites.length > 0) {
    // Assume any construction sites adjacent a Source are containers
    analysis.containerID = sites[0].constructionSite.id as
        Id<ConstructionSite<STRUCTURE_CONTAINER>>;
    analysis.containerPos = [sites[0].x, sites[0].y];
    return analysis;
  }

  const structs = room.lookForAtArea(
      LOOK_STRUCTURES, source.pos.y - 1, source.pos.x - 1, source.pos.y + 1,
      source.pos.x + 1, true);
  if (structs.length > 0) {
    for (const struct of structs) {
      if (struct.structure.structureType === STRUCTURE_CONTAINER) {
        analysis.containerID = struct.structure.id as Id<StructureContainer>;
        analysis.containerPos = [struct.x, struct.y];
        return analysis;
      }
    }
  }

  // Use the end of the best path from either room spawn or center of the room.
  let startPos = new RoomPosition(25, 25, room.name);  // center of room
  const spawns = room.find(FIND_MY_SPAWNS);
  if (spawns.length > 0) {
    startPos = spawns[0].pos;
  }

  const path = room.findPath(startPos, source.pos, {
    ignoreCreeps: true,
    swampCost: 1,
  });

  const end = path[path.length - 2];
  analysis.containerPos = [end.x, end.y];

  return analysis;
}
