import {Behavior, BehaviorMemory} from './behavior';

interface IdlerMemory extends BehaviorMemory {
  destPos?: [number, number];
}

export const IDLER = 'idler';

function randomDirection(): DirectionConstant {
  const seed = Math.random();
  if (seed <= 0.25) {
    return TOP;
  } else if (seed <= 0.5) {
    return BOTTOM;
  } else if (seed <= 0.75) {
    return LEFT;
  } else {
    return RIGHT;
  }
}

/**
 * Creep behavior class for a single creep idle away from any others to avoid
 * congestion.
 *
 * Takes a creep and will search for an open location to wait.
 *
 * Tied to the spawn system, creeps with no active missions will be assigned
 * this behavior.
 */
export class Idler extends Behavior<IdlerMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: IdlerMemory) {
    if (!mem.destPos) {
      const struct = creep.pos.findClosestByRange(FIND_STRUCTURES);
      if (!struct || struct.pos.getRangeTo(creep) >= 2) {
        mem.destPos = [creep.pos.x, creep.pos.y];
      } else {
        // HACK: Just moving randomly for now until we get out of the way
        creep.move(randomDirection());
      }
    }

    if (mem.destPos) {
      const destPos = creep.room.getPositionAt(mem.destPos[0], mem.destPos[1])!;
      if (!creep.pos.isEqualTo(destPos)) {
        creep.moveTo(destPos);
        return true;
      }
    }

    return false;
  }

  public static initMemory(): IdlerMemory {
    return {};
  }
}
