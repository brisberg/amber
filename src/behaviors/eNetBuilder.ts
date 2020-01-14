import {EnergyNode} from '../energy-network/energyNode';
import {findMidPoint} from '../utils/midpoint';

import {Behavior, BehaviorMemory, clearSubBehavior} from './behavior';
import {Builder, BUILDER} from './builder';
import {ENET_FETCHER, ENetFetcher} from './eNetFetcher';

interface ENetBuilderMemory extends BehaviorMemory {
  targetSiteID: Id<ConstructionSite>;
  eNodeFlag: string;
  destPos?: [number, number];
}

export const ENET_BUILDER = 'enet-builder';

/**
 * Creep behavior class for a single creep to build a single structure, drawing
 * energy from the Energy Network.
 *
 * Takes a creep, construction site, and an EnergyNode. Handles moving the creep
 * towards the construction site, and builds it.
 *
 * It will attempt to place itself between the
 * node and the site for easy energy pickup.
 */
export class ENetBuilder extends Behavior<ENetBuilderMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: ENetBuilderMemory) {
    const target = Game.getObjectById(mem.targetSiteID);
    const eNode = new EnergyNode(Game.flags[mem.eNodeFlag]);

    if (!target || !eNode) {
      clearSubBehavior(mem);
      return false;
    }

    // We don't have a destination position or our current one is occupied
    if (!mem.destPos) {
      // We have a EnergyNode, find a static position around it near the target
      // console.log(
      //     creep.name + ' is looking for a new SourceBuild dest location');
      for (let i: number = eNode.flag.pos.x - 1; i <= eNode.flag.pos.x + 1;
           i++) {
        for (let j: number = eNode.flag.pos.y - 1; j <= eNode.flag.pos.y + 1;
             j++) {
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
      if (creep.store.energy < 20) {
        // Invoke the sub-behavior directly as it may not be blocking
        const eFetcher = global.behaviors[ENET_FETCHER];
        if (eFetcher.run(creep, ENetFetcher.initMemory(eNode))) {
          return true;
        }
        // No return as we can still harvest on the same tick
      }

      // Build the target site
      if (creep.store.energy > 0) {
        mem.subBehavior = BUILDER, mem.mem = Builder.initMemory(target);
        return false;
      }
    }

    return false;
  }

  public static initMemory(targetSite: ConstructionSite, eNode: EnergyNode):
      ENetBuilderMemory {
    return {
      eNodeFlag: eNode.flag.name,
      targetSiteID: targetSite.id,
    };
  }
}
