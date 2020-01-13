import {findMidPoint} from '../utils/midpoint';

import {Behavior, BehaviorMemory, clearSubBehavior} from './behavior';
import {Builder, BUILDER} from './builder';
import {Harvester, HARVESTER} from './harvester';

interface SourceBuilderMemory extends BehaviorMemory {
  targetSiteID: Id<ConstructionSite>;
  sourceID: Id<Source>;
  destPos?: [number, number];
}

export const SOURCE_BUILDER = 'source-builder';

/**
 * Specialized Creep behavior class for a single creep to build a single
 * structure, harvesting energy directly from a Source.
 *
 * Takes a creep, construction site, and a Source. Handles moving the creep
 * towards the construction site, and builds it.
 *
 * It will attempt to place itself between the
 * source and the site for easy energy pickup.
 *
 * Generally only used for constructing Containers / Links directly next to
 * Sources.
 */
export class SourceBuilder extends Behavior<SourceBuilderMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: SourceBuilderMemory) {
    const target = Game.getObjectById(mem.targetSiteID);
    const source = Game.getObjectById(mem.sourceID);
    const buildPower = creep.getActiveBodyparts(WORK) * BUILD_POWER;

    if (!target || !source) {
      clearSubBehavior(mem);
      return false;
    }

    // We don't have a destination position or our current one is occupied
    if (!mem.destPos ||
        creep.room.lookForAt(LOOK_CREEPS, mem.destPos[0], mem.destPos[1])
                .length > 0) {
      // We have a source, find a static position between it and the target
      if (!mem.destPos) {
        const midPoint = findMidPoint(source.pos, 1, target.pos, 3, {
          ignoreCreeps: false,
        });

        if (!midPoint) {
          // Throw error? There is no midpoint position between the eNode and
          // the target site
          return false;
        }

        mem.destPos = [midPoint.x, midPoint.y];
      }
    }

    // Move us to the target destination
    if (mem.destPos) {
      const destPos = mem.destPos;
      if (!creep.pos.inRangeTo(destPos[0], destPos[1], 0)) {
        creep.moveTo(destPos[0], destPos[1]);
        return true;
      }

      // Build the structure if we have enough energy
      if (creep.store.energy >= buildPower) {
        mem.subBehavior = BUILDER;
        mem.mem = Builder.initMemory(target);
        return false;
      } else {
        mem.subBehavior = HARVESTER;
        mem.mem = Harvester.initMemory(source);
        return false;
      }
    }

    return false;
  }

  public static initMemory(targetSite: ConstructionSite, source: Source):
      SourceBuilderMemory {
    return {
      sourceID: source.id,
      targetSiteID: targetSite.id,
    };
  }
}
