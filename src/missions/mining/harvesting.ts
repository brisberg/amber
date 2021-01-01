import {setCreepBehavior} from 'behaviors/behavior';
import {
  CONTAINER_HARVESTER,
  ContainerHarvester,
} from 'behaviors/containerHarvester';
import {Idler, IDLER} from 'behaviors/idler';
import {WORKER, zeroRatio} from 'spawn-system/bodyTypes';

import {MAX_WORK_PER_SOURCE} from '../../constants';

import {Mission, MissionMemory} from '../mission';

interface HarvestingMemory extends MissionMemory {
  maxHarvesters: number;
  sourceID: Id<Source>|null;
  containerID: Id<StructureContainer>|null;
}

/**
 * Mission construct to facilitate harvesting of a single Source.
 *
 * This mission will evaluate the source, decide where to place the storage
 * Container near it. The mission will keep requesting new harvester creeps
 * until there are at least 5 WORK parts at play on the Source.
 */
export class HarvestingMission extends Mission<HarvestingMemory> {
  public source: Source|null = null;
  public container: StructureContainer|null = null;

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

  public setContainer(container: StructureContainer): void {
    this.container = container;
    this.mem.containerID = container.id;
  }

  public setMaxHarvesters(max: number): void {
    this.mem.maxHarvesters = max;
  }

  /** @override */
  protected initialMemory(): HarvestingMemory {
    return {
      containerID: null,
      creeps: [],
      maxHarvesters: 0,
      sourceID: null,
    };
  }

  /** @override */
  public init(): boolean {
    if (!this.mem.sourceID || !Game.getObjectById(this.mem.sourceID)) {
      return false;
    }
    if (!this.mem.containerID || !Game.getObjectById(this.mem.containerID)) {
      return false;
    }

    this.container = Game.getObjectById(this.mem.containerID);
    const src = Game.getObjectById(this.mem.sourceID);
    this.source = src;
    return true;
  }

  /** Executes one update tick for this mission */
  public run(): void {
    this.creeps.forEach((harvester, index) => {
      // Hack, force first miner to attempt to move to Container location
      if (index === 0 && this.container &&
          harvester.room.name === this.container.room.name) {
        if (!harvester.pos.isEqualTo(this.container.pos)) {
          setCreepBehavior(
              harvester, IDLER,
              Idler.initMemory([this.container.pos.x, this.container.pos.y]));
          return;
        }
      }

      // Reassign the harvesters if they were given to us
      if (harvester.memory.behavior !== CONTAINER_HARVESTER) {
        setCreepBehavior(
            harvester, CONTAINER_HARVESTER,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            ContainerHarvester.initMemory(this.source!, this.container!));
      }
    });
  }

  private get maxHarvesters(): number {
    return this.mem.maxHarvesters || 0;
  }

  /**
   * @override
   * Returns true if we need another Harvester.
   *
   * Takes into account total WORK parts of existing harvesters and max
   * harvesters from Source Analysis.
   */
  protected needMoreCreeps(): boolean {
    const creeps = this.getYoungCreeps();
    if (creeps.length >= this.maxHarvesters) {
      return false;
    }

    let totalWorkParts = 0;
    for (const harvester of creeps) {
      totalWorkParts += harvester.getActiveBodyparts(WORK);
    }
    if (totalWorkParts >= MAX_WORK_PER_SOURCE + 1) {
      return false;
    }

    return true;
  }

  /** @override */
  /** Returns true if we REALLY need another Harvester. */
  protected needMoreCreepsCritical(): boolean {
    return this.creeps.length < 1;
  }

  public static isHealthy(name: string): boolean {
    const mem = Memory.missions[name];

    if (!mem) {
      return false;
    }

    if (mem.creeps.length === 0) {
      return false;
    }

    return true;
  }
}
