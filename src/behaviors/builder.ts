import {Behavior, BehaviorMemory} from './behavior';

interface BuilderMemory extends BehaviorMemory {
  targetSiteID: Id<ConstructionSite>;
}

export const BUILDER = 'builder';

/**
 * Creep behavior class for a single creep to build a target structure.
 *
 * Takes a creep and a target construction site. Handles moving the creep
 * towards the target and building it.
 *
 * Low level behavior as it will not fetch more energy if the creep is out of
 * energy.
 */
export class Builder extends Behavior<BuilderMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: BuilderMemory): boolean {
    const target = Game.getObjectById(mem.targetSiteID);

    if (target) {
      if (!creep.pos.inRangeTo(target, 3)) {
        creep.moveTo(target, {
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

      // Build the site
      creep.build(target);
      return false;
    }
    return false;
  }

  public static initMemory(target: ConstructionSite): BuilderMemory {
    return {
      targetSiteID: target.id,
    };
  }
}
