/**
 * Utility package which will evaluate a Room Controller for upgrading.
 *
 * Returns a UpgradeControllerAnalysis object with designates the best location
 * for a Container.
 */

export interface UpgradeControllerAnalysis {
  containerPos: number[];  // [x, y]
  controllerID: Id<StructureController>;
}

/** Radius around the controller to search for a reusable container */
const SEARCH_RADIUS = 2;

/**
 * Analyzes a Room Controller and returns a report containing information
 * relevent for setting up a upgade missions for the controller.
 */
export function analyzeControllerForUpgrading(controller: StructureController):
    UpgradeControllerAnalysis {
  const analysis: UpgradeControllerAnalysis = {
    containerPos: [0, 0],
    controllerID: controller.id,
  };
  const room = controller.room;

  // Determine best container location

  // Use the end of the best path from either room spawn or center of the room.
  let startPos = new RoomPosition(25, 25, room.name);  // center of room
  const spawns = room.find(FIND_MY_SPAWNS);
  if (spawns.length > 0) {
    startPos = spawns[0].pos;
  }

  const path = room.findPath(startPos, controller.pos, {
    ignoreCreeps: true,
    swampCost: 1,
  });

  // Pick a spot 2 cells away from the controller
  const end = path[path.length - 3];
  analysis.containerPos = [end.x, end.y];
  // TODO: Check that this container is open on some number of sides to allow
  // for multiple upgraders

  // Alternatively, Locate and reuse an existing Container or Construction site
  const sites = room.lookForAtArea(
      LOOK_CONSTRUCTION_SITES, controller.pos.y - SEARCH_RADIUS,
      controller.pos.x - SEARCH_RADIUS, controller.pos.y + SEARCH_RADIUS,
      controller.pos.x + SEARCH_RADIUS, true);
  sites.forEach((site) => {
    if (site.constructionSite.structureType === STRUCTURE_CONTAINER) {
      // Reuse this Container construction site
      analysis.containerPos = [site.x, site.y];
    }
  });

  const structs = room.lookForAtArea(
      LOOK_STRUCTURES, controller.pos.y - SEARCH_RADIUS,
      controller.pos.x - SEARCH_RADIUS, controller.pos.y + SEARCH_RADIUS,
      controller.pos.x + SEARCH_RADIUS, true);
  structs.forEach((struct) => {
    if (struct.structure.structureType === STRUCTURE_CONTAINER) {
      // Reuse this Container
      analysis.containerPos = [struct.x, struct.y];
    }
  });

  return analysis;
}
