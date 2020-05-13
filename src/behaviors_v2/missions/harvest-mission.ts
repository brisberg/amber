import {WORKER, zeroRatio} from 'spawn-system/bodyTypes';

import {Mission, MissionMemory} from '../../missions/mission';

import HarvestBehavior from '../behaviors/harvest';
import RelieveBehavior from '../behaviors/relieve';

interface HarvestMemory extends MissionMemory {
  sourceID: Id<Source>|null;
}

/**
 * Mission construct to facilitate drop-harvesting of a single Source.
 *
 * This mission will maintain a single creep (up to 6 work in size) harvesting a
 * source. It will request new ones and relieve the older creep when it arrives.
 */
export class HarvestMission extends Mission<HarvestMemory> {
  public source: Source|null = null;

  protected readonly bodyType: string = WORKER;
  protected readonly bodyOptions = {
    max: {work: 6},
    min: {...zeroRatio, carry: 1},
  };
  protected readonly spawnPriority = 2;

  constructor(flag: Flag) {
    super(flag);
  }

  public setSource(source: Source): void {
    this.source = source;
    this.mem.sourceID = source.id;
  }

  /** @override */
  protected initialMemory(): HarvestMemory {
    return {
      creeps: [],
      sourceID: null,
    };
  }

  /** @override */
  public init(): boolean {
    if (!this.mem.sourceID || !Game.getObjectById(this.mem.sourceID)) {
      return false;
    }

    const src = Game.getObjectById(this.mem.sourceID);
    this.source = src;
    return true;
  }

  /** Executes one update tick for this mission */
  public run(): void {
    if (!this.source) return;

    const source = this.source;
    this.creeps.forEach((harvester, index) => {
      if (index === 0) {
        // Reassign the harvesters if they were given to us
        if (harvester.memory.mem.name !== 'harvest') {
          harvester.memory.mem = new HarvestBehavior().new(source);
        }
      }

      if (index === 1) {
        // Assign our replacement
        if (harvester.memory.mem.name !== 'relieve') {
          harvester.memory.mem = new RelieveBehavior().new(this.creeps[0]);
        }
      }
    });
  }

  /**
   * @override
   * Returns true if we need another Harvester.
   *
   */
  protected needMoreCreeps(): boolean {
    const creeps = this.getYoungCreeps();
    if (creeps.length >= 1) {
      return false;
    }

    return true;
  }
}
