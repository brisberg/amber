import {setCreepBehavior} from 'behaviors/behavior';
import {SENTRY, Sentry} from 'behaviors/sentry';
import {GenerateCreepBodyOptions, SCOUT} from 'spawn-system/bodyTypes';

import {Mission, MissionMemory} from '../mission';

type ManualMissionMemory = MissionMemory;

/**
 * Mission is for manual scouting. Flag is only placed by hand in the Web Client
 * and moved by hand.
 *
 * This mission will request a single scout creep, which will move to the
 * location as best it can.
 *
 * The Mission must be initialized with the closest spawn source
 * `Memory.missions['scout_1'].spawnSource = 'N1W1'`
 */
export class ManualMission extends Mission<ManualMissionMemory> {
  protected readonly spawnPriority = 5;
  protected readonly bodyType = SCOUT;
  protected readonly bodyOptions: GenerateCreepBodyOptions = {
    max: {move: 1},
  };

  constructor(flag: Flag) {
    super(flag);
  }

  protected initialMemory(): ManualMissionMemory {
    return {
      creeps: [],
    };
  }

  public init(): boolean {
    return true;
  }

  /** Executes one update tick for this mission */
  public run(): void {
    // Direct each creep to move to mission flag
    this.creeps.forEach((creep) => {
      if (creep.memory.behavior !== SENTRY) {
        setCreepBehavior(
            creep,
            SENTRY,
            Sentry.initMemory(this.name),
        );
        creep.memory.mission = this.name;
      }
    });
  }

  private get maxScouts(): number {
    return 1;
  }

  /**
   * @override
   * Returns true if we need another Scout.
   */
  protected needMoreCreeps(): boolean {
    // Don't spawn scout until a spawn source is manually set
    if (!this.mem.spawnSource) {
      return false;
    }

    const creeps = this.getYoungCreeps();
    if (creeps.length >= this.maxScouts) {
      return false;
    }

    return true;
  }

  /** @override */
  /** This mission is never critical. */
  protected needMoreCreepsCritical(): boolean {
    return false;
  }
}
