import {Builder} from 'roles/builder';
import {SpawnReservation} from 'spawnQueue';
import {createWorkerBody} from 'utils/workerUtils';

/**
 * Energy source for this missions.
 *
 * RawSource - Source which the builders mine manually (rarely used, mainly
 * during bootstrap)
 * Structure - Storage, Container or Link structure, by far the most common.
 * Creep - Collect directly from Hauler creeps who will be at the specified
 * location. Often used for remote construction.
 */
type SourceType = 'rawSource'|'structure'|'creep';

interface BuildMissionMemory {
  builders: string[];
  reservations: SpawnReservation[];
  source: {
    sourceID?: Id<Source>,
    structure?: Id<StructureContainer|StructureStorage|StructureLink>,
    // creep:
  };
  targetSiteID: Id<ConstructionSite>|null;
}

/**
 * Mission construct to facilitate constructing a single building.
 *
 * This mission will coordinate requesting builder creeps, and can specify
 * several sources for the energy.
 */
export class BuildMission {
  private static spawnPriority = 1;

  public name: string;
  public room: Room|null = null;
  public target: ConstructionSite|null = null;

  private builders: Creep[] = [];
  private mem: BuildMissionMemory;

  constructor(name: string) {
    this.name = name;

    // Init memory
    if (!Memory.missions[name]) {
      const mem: BuildMissionMemory = {
        builders: [],
        reservations: [],
        source: {},
        targetSiteID: null,
      };
      Memory.missions[name] = mem;
    }
    this.mem = Memory.missions[name] as BuildMissionMemory;

    if (this.mem.targetSiteID) {
      const target = Game.getObjectById(this.mem.targetSiteID);
      // TODO: handle blind constructio
      this.room = target ? target.room! : null;
      this.target = target;
    }

    // Purge names of dead/expired creeps
    this.mem.builders = this.mem.builders.filter((cName) => Game.creeps[cName]);
    this.builders = this.mem.builders.map((cName) => Game.creeps[cName]);
  }

  public setTargetSite(target: ConstructionSite) {
    this.target = target;
    this.mem.targetSiteID = target.id;
  }

  public setSource(source: Source) {
    this.mem.source.sourceID = source.id;
  }

  /** Executes one update tick for this mission */
  public run() {
    if (this.mem.targetSiteID && !Game.getObjectById(this.mem.targetSiteID)) {
      // Construction complete
      // Remove this mission and deallocate all of the creeps
    }

    // Check for creep allocation
    if (this.needMoreBuilders()) {
      this.requestBuilder();
    }

    // Claim reserved creeps
    this.mem.reservations = this.mem.reservations.filter((reserve) => {
      const creep = Game.creeps[reserve.name];
      if (creep) {
        this.mem.builders.push(reserve.name);
        this.builders.push(creep);
        return false;
      }
      return true;
    });

    // Determine our source
    // TODO: Only works with sources for now
    const source = Game.getObjectById(this.mem.source.sourceID!);

    // Direct each creep to mine or build
    this.builders.forEach((creep) => {
      if (creep.memory.role === 'builder' && creep.store.energy === 0) {
        // Fetch more energy
        creep.memory = {
          role: 'miner',
          sourceID: this.mem.source.sourceID,
        };
      } else if (
          creep.memory.role === 'miner' &&
          creep.store.getFreeCapacity() === 0) {
        // Have energy, build the structure
        creep.memory = {
          role: 'builder',
          targetSiteID: this.mem.targetSiteID!,
        };
      }
    });
  }

  private get maxBuilders() {
    return 1;
  }

  /**
   * Returns true if we need another Harvester.
   *
   * Takes into account total WORK parts of existing harvesters and max
   * harvesters from Source Analysis.
   */
  private needMoreBuilders(): boolean {
    if (this.builders.length + this.mem.reservations.length >=
        this.maxBuilders) {
      return false;
    }

    return true;
  }

  private requestBuilder() {
    // Request another Builder
    const name = this.name + Game.time;
    const res = global.spawnQueue.requestCreep({
      body: this.createHarvesterBody(),
      name,
      options: {
        memory: {
          role: 'builder',
          targetSiteID: this.mem.targetSiteID!,
        },
      },
      priority: BuildMission.spawnPriority,
    });
    this.mem.reservations.push(res);
  }

  private createHarvesterBody() {
    return createWorkerBody(2, 1, 1);
  }

  /**
   * Cleans up the memory associated with this missions, returns the list names
   * of orphaned creeps.
   */
  public static cleanup(name: string): string[] {
    const builders: string[] = Memory.missions[name].builders;
    builders.forEach((cName) => delete Memory.creeps[cName]);
    delete Memory.missions[name];
    return builders;
  }
}
