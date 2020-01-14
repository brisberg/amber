import {CONTAINER_HARVESTER, ContainerHarvester} from 'behaviors/containerHarvester';
import {WORKER_1} from 'spawn-system/bodyTypes';

import {MAX_WORK_PER_SOURCE} from '../constants';

interface HarvestingMemory {
  harvesters: string[];
  nextHarvester?: string;
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
export class HarvestingMission {
  private static spawnPriority = 3;

  public name: string;
  public room: Room|null = null;
  public source: Source|null = null;
  public container: StructureContainer|null = null;

  private harvesters: Creep[] = [];
  private mem: HarvestingMemory;

  constructor(name: string) {
    this.name = name;

    // Init memory
    if (!Memory.missions[name]) {
      const mem: HarvestingMemory = {
        containerID: null,
        harvesters: [],
        maxHarvesters: 0,
        sourceID: null,
      };
      Memory.missions[name] = mem;
    }
    this.mem = Memory.missions[name] as HarvestingMemory;

    if (this.mem.sourceID) {
      const src = Game.getObjectById(this.mem.sourceID);
      this.source = src;
      this.room = src ? src.room : null;
    }
    if (this.mem.containerID) {
      this.container = Game.getObjectById(this.mem.containerID);
    }

    // Purge names of dead/expired creeps
    this.mem.harvesters =
        this.mem.harvesters.filter((cName) => Game.creeps[cName]);
    this.harvesters = this.mem.harvesters.map((cName) => Game.creeps[cName]);
  }

  public setSource(source: Source) {
    this.source = source;
    this.mem.sourceID = source.id;
  }

  public setContainer(container: StructureContainer) {
    this.container = container;
    this.mem.containerID = container.id;
  }

  public setMaxHarvesters(max: number) {
    this.mem.maxHarvesters = max;
  }

  /** Executes one update tick for this mission */
  public run() {
    if (!this.source || !this.container) {
      return;
    }

    // Claim reserved creep if it exists
    if (this.mem.nextHarvester && Game.creeps[this.mem.nextHarvester]) {
      const harvester = Game.creeps[this.mem.nextHarvester];
      this.mem.harvesters.push(harvester.name);
      this.harvesters.push(harvester);
      delete this.mem.nextHarvester;
    } else {
      // Oh well, it wasn't spawned afterall
      delete this.mem.nextHarvester;
    }

    // Check for creep allocation
    if (this.needMoreHarvesters()) {
      this.requestHarvester();
    }

    this.harvesters.forEach((harvester) => {
      // Reassign the harvesters if they were given to us
      if (harvester.memory.behavior !== CONTAINER_HARVESTER) {
        harvester.memory = {
          behavior: CONTAINER_HARVESTER,
          bodyType: 'worker',
          mem: ContainerHarvester.initMemory(this.source!, this.container!),
          mission: this.name,
        };
      }
    });
  }

  private get maxHarvesters() {
    return this.mem.maxHarvesters || 0;
  }

  /**
   * Returns true if we need another Harvester.
   *
   * Takes into account total WORK parts of existing harvesters and max
   * harvesters from Source Analysis.
   */
  private needMoreHarvesters(): boolean {
    if (this.harvesters.length >= this.maxHarvesters) {
      return false;
    }

    let totalWorkParts = 0;
    for (const harvester of this.harvesters) {
      totalWorkParts += harvester.getActiveBodyparts(WORK);
    }
    if (totalWorkParts >= MAX_WORK_PER_SOURCE + 1) {
      return false;
    }

    return true;
  }

  private requestHarvester() {
    // Request another harvester
    this.mem.nextHarvester = global.spawnQueue.requestCreep({
      bodyType: WORKER_1,
      mission: this.name,
      priority: HarvestingMission.spawnPriority,
    });
  }
}
