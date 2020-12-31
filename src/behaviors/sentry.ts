import {Behavior, BehaviorMemory} from './behavior';

interface SentryMemory extends BehaviorMemory {
  flagName: string;
}

export const SENTRY = 'sentry';

/**
 * Creep behavior class for a single creep stand guard at a specific location.
 *
 * May be used by scouts or guards.
 */
export class Sentry extends Behavior<SentryMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: SentryMemory): boolean {
    if (!Game.flags[mem.flagName]) {
      return false;
    }

    const flag = Game.flags[mem.flagName];
    if (!creep.pos.isEqualTo(flag.pos)) {
      // HACK: Ignoring terrain, assuming we are a 1M Scout
      creep.moveTo(flag, {
        ignoreRoads: true,
        swampCost: 1,
        plainCost: 1,
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

    return false;
  }

  public static initMemory(flagName: string): SentryMemory {
    return {
      flagName,
    };
  }
}
