interface FindMidPointOptions {
  ignoreCreeps?: boolean;
  ignoreRoads?: boolean;
  swampCost?: number;
}

/**
 * Utility to find a position between two points which satisfies ranged limits
 * for each point.
 *
 * By Default ignores creeps, roads, and swamps.
 * Assumes the two positions are in the same room.
 */
export function findMidPoint(
    pos1: RoomPosition, range1: number, pos2: RoomPosition, range2: number,
    opts: FindMidPointOptions = {}): RoomPosition|null {
  if (pos1.roomName !== pos2.roomName) {
    // Positions must be in the same room.
    return null;
  }

  // Determine the best location between the two positions
  const pathOpts: FindPathOpts = {
    ignoreCreeps: opts.ignoreCreeps || true,
    ignoreRoads: opts.ignoreRoads || true,
    swampCost: opts.swampCost || 1,
  };
  const path = pos1.findPathTo(pos2, pathOpts);

  if (path.length === 0) {
    return null;
  }

  for (const step of path) {
    const pos = new RoomPosition(step.x, step.y, pos1.roomName);
    if (pos.inRangeTo(pos1.x, pos1.y, range1) &&
        pos.inRangeTo(pos2.x, pos2.y, range2)) {
      return pos;
    }
  }

  return null;
}
