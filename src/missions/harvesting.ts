import {Harvester} from 'roles/harvester';
import {createWorkerBody} from 'utils/workerUtils';

import {MAX_WORK_PER_SOURCE} from '../constants';

import {analyzeSourceForHarvesting, SourceAnalysis} from './sourceAnalysis';

interface SpawnReservation {
  creepName: string;
}

interface HarvestingMemory {
  analysis: SourceAnalysis|null;
  harvesters: string[];
  nextId: number;
  reservations: SpawnReservation[];
  sourceID: Id<Source>|null;
  containerID: Id<StructureContainer|ConstructionSite<STRUCTURE_CONTAINER>>|
      null;
}

/**
 * Mission construct to facilitate harvesting of a single Source.
 *
 * This mission will evaluate the source, decide where to place the storage
 * Container near it. The mission will keep requesting new harvester creeps
 * until there are at least 5 WORK parts at play on the Source.
 */
export class HarvestingMission {
  private static spawnPriority = 1;

  public name: string;
  public room: Room;
  public source: Source;
  public container: StructureContainer|ConstructionSite<STRUCTURE_CONTAINER>|
      null = null;

  private harvesters: Creep[] = [];
  private mem: HarvestingMemory;

  constructor(name: string, source: Source) {
    this.name = name;
    this.room = source.room;
    this.source = source;

    // Init memory
    if (!Memory.missions[name]) {
      const mem: HarvestingMemory = {
        analysis: null,
        containerID: null,
        harvesters: [],
        nextId: 0,
        reservations: [],
        sourceID: source.id,
      };
      Memory.missions[name] = mem;
    }
    this.mem = Memory.missions[name] as HarvestingMemory;

    if (this.mem.containerID) {
      this.container = Game.getObjectById(this.mem.containerID);
    }
    // Purge names of dead/expired creeps
    this.mem.harvesters =
        this.mem.harvesters.filter((cName) => Game.creeps[cName]);
    this.harvesters = this.mem.harvesters.map((cName) => Game.creeps[cName]);
  }

  /** Executes one update tick for this mission */
  public run() {
    // Run source analysis if we don't have one
    if (!this.mem.analysis) {
      this.mem.analysis = analyzeSourceForHarvesting(this.source);
    }

    if (!this.container) {
      // Look for an existing Container or Construction Site at these locations
      const results = this.room.lookAt(
          this.mem.analysis.containerPos[0], this.mem.analysis.containerPos[1]);
      results.some((lookup) => {
        if (lookup.constructionSite &&
            lookup.constructionSite.structureType === STRUCTURE_CONTAINER) {
          this.setContainer(
              lookup.constructionSite as ConstructionSite<STRUCTURE_CONTAINER>);
          return true;
        } else if (
            lookup.structure &&
            lookup.structure.structureType === STRUCTURE_CONTAINER) {
          this.setContainer(lookup.structure as StructureContainer);
          return true;
        }
        return false;
      });

      if (!this.container) {
        // No container assigned or none exsists, need to build a new one
        this.room.createConstructionSite(
            this.mem.analysis.containerPos[0],
            this.mem.analysis.containerPos[1], STRUCTURE_CONTAINER);
      }
    }

    if (this.container) {
      // Check for creep allocation
      if (this.needMoreHarvesters()) {
        this.requestHarvester();
      }

      // Claim reserved creeps
      this.mem.reservations = this.mem.reservations.filter((reserve) => {
        const creep = Game.creeps[reserve.creepName];
        if (creep) {
          this.mem.harvesters.push(reserve.creepName);
          this.harvesters.push(creep);
          return false;
        }
        return true;
      });

      // Execute creep update ticks
      this.harvesters.forEach((creep) => {
        const harvester = new Harvester(creep);
        harvester.run();
      });
    }
  }

  private get maxHarvesters() {
    return this.mem.analysis ? this.mem.analysis.maxHarvesters : 0;
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
      totalWorkParts += 2;
      // TODO: record in reservations how many parts it has
    }
    if (totalWorkParts >= MAX_WORK_PER_SOURCE + 1) {
      return false;
    }

    return true;
  }

  private setContainer(container: StructureContainer|
                       ConstructionSite<STRUCTURE_CONTAINER>) {
    this.container = container;
    this.mem.containerID = container.id;
    this.harvesters.forEach((harvester) => {
      harvester.memory.containerID = container.id;
    });
  }

  private requestHarvester() {
    // Request another harvester
    const name = this.name + Game.time;
    global.spawnQueue.requestCreep({
      body: this.createHarvesterBody(),
      name,
      options: {
        memory: {
          containerID: this.mem.containerID,
          role: 'harvester',
          sourceID: this.source.id,
        },
      },
      priority: HarvestingMission.spawnPriority,
    });
    this.mem.reservations.push({creepName: name});
    this.mem.nextId++;
  }

  private createHarvesterBody() {
    return createWorkerBody(2, 1, 1);
  }
}
