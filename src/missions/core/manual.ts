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
    this.mem.spawnSource = 'E16N18';  // HACK: Hardcoding north base
    return true;
  }

  /** Executes one update tick for this mission */
  public run(): void {
    // Direct each creep to move to mission flag
    this.creeps.forEach((creep) => {
      if (creep.memory.behavior !== SENTRY) {
        // Upgrade controller
        setCreepBehavior(
            creep,
            SENTRY,
            Sentry.initMemory(this.name),
        );
        creep.memory.mission = this.name;
      }
    });
  }

  private get maxClaimers(): number {
    return 1;
  }

  /**
   * @override
   * Returns true if we need another Claimer.
   */
  protected needMoreCreeps(): boolean {
    const creeps = this.getYoungCreeps();
    if (creeps.length >= this.maxClaimers) {
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
