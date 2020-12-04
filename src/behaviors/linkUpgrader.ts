import {Behavior, BehaviorMemory} from './behavior';
import {Upgrader, UPGRADER} from './upgrader';

interface LinkUpgraderMemory extends BehaviorMemory {
  controllerID: Id<StructureController>;
  linkID: Id<StructureLink>;
  destPos?: [number, number];
}

export const LINK_UPGRADER = 'link-upgrader';

/**
 * TODO: Unify this with the container option
 * Creep behavior class for a single creep to upgrade a Room Controller from a
 * Link.
 *
 * Takes a Creep, room Controller, and a Link. Handles moving the creep
 * between the Link and the controller. Will gather energy from the Energy
 * Source and upgrade the controller.
 */
export class LinkUpgrader extends Behavior<LinkUpgraderMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: LinkUpgraderMemory): boolean {
    const controller = Game.getObjectById(mem.controllerID);
    const link = Game.getObjectById(mem.linkID);

    if (!link) {
      console.log('Upgrader not assigned a valid Link');
      return false;
    }

    if (!controller) {
      console.log('Upgrader not assigned a valid Room Controller');
      return false;
    }

    // We don't have a destination position or our current one is occupied
    if (!mem.destPos) {
      // We have a source, find a static position around it near the target
      // console.log(
      //     creep.name + ' is looking for a new SourceBuild dest location');
      for (let i: number = link.pos.x - 1; i <= link.pos.x + 1; i++) {
        for (let j: number = link.pos.y - 1; j <= link.pos.y + 1; j++) {
          // Cannot stand on top of links
          if (i === link.pos.x && j === link.pos.y) continue;

          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const pos = creep.room.getPositionAt(i, j)!;
          if (pos.lookFor(LOOK_TERRAIN)[0] !== 'wall') {
            const occupied =
                creep.room.lookForAt(LOOK_CREEPS, pos.x, pos.y).length > 0;
            if (!occupied) {
              mem.destPos = [pos.x, pos.y];
            }
          }
        }
      }
    }

    if (mem.destPos) {
      const creeps =
          creep.room.lookForAt(LOOK_CREEPS, mem.destPos[0], mem.destPos[1]);
      if (creeps.length > 0 && creeps[0].id !== creep.id) {
        // Someone else took our spot, forget it
        delete mem.destPos;
      }
    }

    // Move us to the target destination
    if (mem.destPos) {
      const destPos = mem.destPos;
      if (!creep.pos.inRangeTo(destPos[0], destPos[1], 0)) {
        creep.moveTo(destPos[0], destPos[1]);
        return true;
      }

      // Attempt to refill from energy source
      if (creep.store.energy < 20 && link.store.energy > 0) {
        const amount = Math.min(
            creep.store.getFreeCapacity(),
            link.store.energy,
        );
        creep.withdraw(link, RESOURCE_ENERGY, amount);
      }

      // Upgrade the controller
      if (creep.store.energy > 0) {
        mem.subBehavior = UPGRADER;
        mem.mem = Upgrader.initMemory(controller);
        return false;
      }
    }

    return false;
  }

  public static initMemory(
      controller: StructureController,
      link: StructureLink): LinkUpgraderMemory {
    return {
      linkID: link.id,
      controllerID: controller.id,
    };
  }
}
