import {Behavior, BehaviorMemory, clearSubBehavior} from './behavior';
import {Builder, BUILDER} from './builder';
import {Harvester, HARVESTER} from './harvester';

interface SourceBuilderMemory extends BehaviorMemory {
  targetSiteID: Id<ConstructionSite>;
  sourceID: Id<Source>;
  state: 'mine'|'build';
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
  protected behaviorActions(creep: Creep, mem: SourceBuilderMemory): boolean {
    const target = Game.getObjectById(mem.targetSiteID);
    const source = Game.getObjectById(mem.sourceID);
    // const buildPower = creep.getActiveBodyparts(WORK) * BUILD_POWER;

    if (!target || !source) {
      clearSubBehavior(mem);
      return false;
    }

    while (true) {
      if (mem.state === 'mine') {
        if (creep.store.getFreeCapacity() === 0) {
          mem.state = 'build';
          continue;
        }

        // Build the structure if we have enough energy
        if (creep.pos.inRangeTo(source.pos.x, source.pos.y, 1)) {
          mem.subBehavior = HARVESTER;
          mem.mem = Harvester.initMemory(source);
          return false;
        } else {
          creep.moveTo(source);
          return true;
        }
      } else if (mem.state === 'build') {
        if (creep.store.energy === 0) {
          mem.state = 'mine';
          continue;
        }

        if (creep.pos.inRangeTo(target.pos.x, target.pos.y, 3)) {
          mem.subBehavior = BUILDER;
          mem.mem = Builder.initMemory(target);
          return false;
        } else {
          creep.moveTo(target);
          return true;
        }
      }
    }
  }

  public static initMemory(targetSite: ConstructionSite, source: Source):
      SourceBuilderMemory {
    return {
      sourceID: source.id,
      state: 'mine',
      targetSiteID: targetSite.id,
    };
  }
}
