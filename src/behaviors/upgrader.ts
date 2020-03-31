import {Behavior, BehaviorMemory} from './behavior';

interface UpgraderMemory extends BehaviorMemory {
  controllerID: Id<StructureController>;
}

export const UPGRADER = 'upgrader';

/**
 * Creep behavior class for a single creep to upgrade a Room Controller.
 *
 * Takes a creep and a room controller. Handles moving the creep
 * to the controller.
 *
 * Low level Behavior. Will not fetch more energy if it is missing.
 */
export class Upgrader extends Behavior<UpgraderMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: UpgraderMemory): boolean {
    const controller = Game.getObjectById(mem.controllerID);

    if (!controller) {
      console.log('Upgrader not assigned a valid Room Controller');
      return false;
    }

    if (controller) {
      if (!creep.pos.inRangeTo(controller, 3)) {
        creep.moveTo(controller);
        return true;
      }

      // We have arrived
      creep.upgradeController(controller);
      return false;
    }

    return false;
  }

  public static initMemory(controller: StructureController): UpgraderMemory {
    return {
      controllerID: controller.id,
    };
  }
}
