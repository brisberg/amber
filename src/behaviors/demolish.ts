import {Behavior, BehaviorMemory} from './behavior';

interface DemolishMemory extends BehaviorMemory {
  roomname: string;
  structureID: Id<Structure>|null;
}

export const DEMOLISHER = 'demolisher';

/**
 * Creep behavior class for a single creep to demolish structures.
 *
 * Takes a creep and a roomname and/or a structure ID. If we cannot see the room
 * it will assume there are structures there and make it's way to the room. From
 * there it will dismantle the structure until it is destroyed.
 */
export class Demolisher extends Behavior<DemolishMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: DemolishMemory): boolean {
    const room = Game.rooms[mem.roomname];

    if (room && mem.structureID) {  // We can see the target room
      const target = Game.getObjectById(mem.structureID);

      if (!target) {
        // Throw an error? We have no target
        return false;
      }

      if (!creep.pos.inRangeTo(target, 1)) {
        creep.moveTo(target);
        return true;
      }

      // We have arrived

      // Dismantle the structure
      creep.dismantle(target);
      return false;
    }
    return false;
  }

  /** Returns the target structure to be demolished */
  public static getTargetID(mem: DemolishMemory): Id<Structure>|null {
    return mem.structureID;
  }

  public static initMemory(roomname: string, struct: Structure):
      DemolishMemory {
    return {
      structureID: struct.id,
      roomname,
    };
  }
}
