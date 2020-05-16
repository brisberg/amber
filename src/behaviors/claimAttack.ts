import {Behavior, BehaviorMemory} from './behavior';

interface ClaimAttackMemory extends BehaviorMemory {
  roomname: string;
  containerID: Id<StructureController>|null;
}

export const CLAIM_ATTTACK = 'claim-attacker';

/**
 * Creep behavior class for a single creep to attack a hostile/reserved
 * controller.
 *
 * Takes a creep and a roomname and/or controllerID. If we cannot see the room,
 * it will assume there is a controller there and make it's way to the target
 * room.
 */
export class ClaimAttacker extends Behavior<ClaimAttackMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: ClaimAttackMemory): boolean {
    const room = Game.rooms[mem.roomname];

    if (room) {  // We can see the target room
      const ctrl = room.controller;

      if (!ctrl) {
        // Throw an error? The target room has no controller
        return false;
      }

      if (!creep.pos.inRangeTo(ctrl, 1)) {
        creep.moveTo(ctrl);
        return true;
      }

      // We have arrived

      // Attack the controller
      creep.attackController(ctrl);
      return false;
    }
    return false;
  }

  public static initMemory(roomname: string): ClaimAttackMemory {
    return {
      containerID: null,
      roomname,
    };
  }
}
