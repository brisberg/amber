import {Behavior, BehaviorMemory} from './behavior';

interface HarvesterMemory extends BehaviorMemory {
  sourceID: Id<Source>;
}

export const HARVESTER = 'harvester';

/**
 * Creep behavior class for a single creep to harvest a single Energey Source
 *
 * Takes a creep and a source. Handles moving the creep towards the source,
 * harvesting it.
 *
 * Low level behavior as it only stores the energy within the creep. Often
 * combined with other behaviors to persistant harvesting operations.
 */
export class Harvester extends Behavior<HarvesterMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: HarvesterMemory): boolean {
    const source = Game.getObjectById(mem.sourceID);

    if (source) {
      if (!creep.pos.inRangeTo(source, 1)) {
        creep.moveTo(source);
        return true;
      }

      // We have arrived

      if (creep.store.getFreeCapacity() > 0) {
        if (!creep.pos.inRangeTo(source, 1)) {
          creep.moveTo(source);
          return true;
        }
        creep.harvest(source);
        return false;
      }
    }
    return false;
  }

  public static initMemory(source: Source): HarvesterMemory {
    return {
      sourceID: source.id,
    };
  }
}
