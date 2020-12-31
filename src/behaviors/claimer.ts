import {Behavior, BehaviorMemory} from './behavior';

interface ClaimerMemory extends BehaviorMemory {
  roomname: string;
  containerID: Id<StructureController>|null;
}

export const CLAIMER = 'claimer';

/**
 * Creep behavior class for a single creep to claim a controller.
 *
 * Takes a creep and a roomname and/or controllerID. If we cannot see the room,
 * it will assume there is a controller there and make it's way to the target
 * room.
 */
export class Claimer extends Behavior<ClaimerMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: ClaimerMemory): boolean {
    const room = Game.rooms[mem.roomname];

    if (room) {  // We can see the target room
      const ctrl = room.controller;

      if (!ctrl) {
        // Throw an error? The target room has no controller
        return false;
      }

      if (!creep.pos.inRangeTo(ctrl, 1)) {
        creep.moveTo(ctrl, {
          costCallback: (roomname, costMatrix) => {
            // Hack for season instance to avoid a hostil room
            if (roomname === 'E7S28') {
              for (let i = 0; i < 50; i++) {
                // North exit is unwalkable
                costMatrix.set(i, 0, 255);
              }
            }

            return costMatrix;
          },
        });
        return true;
      }

      // We have arrived

      // Claim the controller
      if (!ctrl.my) {
        if (!ctrl.owner) {
          creep.claimController(ctrl);
        }

        if (ctrl.owner ||
            (ctrl.reservation && ctrl.reservation.ticksToEnd > 0)) {
          creep.attackController(ctrl);
        }
      }
      return false;
    }
    return false;
  }

  public static initMemory(roomname: string): ClaimerMemory {
    return {
      containerID: null,
      roomname,
    };
  }
}
