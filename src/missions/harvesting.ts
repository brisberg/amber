import {SpawnReservation} from 'spawnQueue';
import {BODY_MANIFEST_INDEX} from 'utils/bodypartManifest';
import {createWorkerBody} from 'utils/workerUtils';

import {MAX_WORK_PER_SOURCE} from '../constants';

interface HarvestingMemory {
  harvesters: string[];
  maxHarvesters: number;
  reservations: SpawnReservation[];
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
        reservations: [],
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

    // Check for creep allocation
    if (this.needMoreHarvesters()) {
      this.requestHarvester();
    }

    // Claim reserved creeps
    this.mem.reservations = this.mem.reservations.filter((reserve) => {
      const creep = Game.creeps[reserve.name];
      if (creep) {
        this.mem.harvesters.push(reserve.name);
        this.harvesters.push(creep);
        return false;
      }
      return true;
    });

    this.harvesters.forEach((harvester) => {
      // Reassign the harvesters if they were given to us
      if (harvester.memory.role !== 'harvester') {
        harvester.memory = {
          containerID: this.container!.id,
          role: 'harvester',
          sourceID: this.source!.id,
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
    if (this.harvesters.length + this.mem.reservations.length >=
        this.maxHarvesters) {
      return false;
    }

    let totalWorkParts = 0;
    for (const harvester of this.harvesters) {
      totalWorkParts += harvester.getActiveBodyparts(WORK);
    }
    for (const res of this.mem.reservations) {
      totalWorkParts += res.loadout[BODY_MANIFEST_INDEX[WORK]];
    }
    if (totalWorkParts >= MAX_WORK_PER_SOURCE + 1) {
      return false;
    }

    return true;
  }

  private requestHarvester() {
    // Request another harvester
    const name = this.name + Game.time;
    const res = global.spawnQueue.requestCreep({
      body: this.createHarvesterBody(),
      name,
      options: {
        memory: {
          containerID: this.mem.containerID,
          role: 'harvester',
          sourceID: this.mem.sourceID || undefined,
        },
      },
      priority: HarvestingMission.spawnPriority,
    });
    this.mem.reservations.push(res);
  }

  private createHarvesterBody() {
    return createWorkerBody(2, 1, 1);
  }
}
