import {SpawnReservation} from 'spawnQueue';
import {createWorkerBody} from 'utils/workerUtils';

/**
 * Energy source for this missions.
 *
 * RawSource - Source which the upgraders mine manually (rarely used, mainly
 * during bootstrap)
 * Structure - Storage, Container or Link structure, by far the most common.
 * Creep - Collect directly from Hauler creeps who will be at the specified
 * location. Often used for remote construction.
 */
type SourceType = 'rawSource'|'structure'|'creep';

interface UpgradeMissionMemory {
  upgraders: string[];
  reservations: SpawnReservation[];
  source: {
    // sourceID?: Id<Source>,
    structure?: Id<StructureContainer>,
    // creep:
  };
  controllerID: Id<StructureController>|null;
}

/**
 * Mission construct to facilitate upgrading a single room controller.
 *
 * This mission will coordinate requesting upgrader creeps, and can specify
 * several sources for the energy.
 */
export class UpgradeMission {
  private static spawnPriority = 1;

  public name: string;
  public room: Room|null = null;
  public controller: StructureController|null = null;

  private upgraders: Creep[] = [];
  private mem: UpgradeMissionMemory;

  constructor(name: string) {
    this.name = name;

    // Init memory
    if (!Memory.missions[name]) {
      const mem: UpgradeMissionMemory = {
        controllerID: null,
        reservations: [],
        source: {},
        upgraders: [],
      };
      Memory.missions[name] = mem;
    }
    this.mem = Memory.missions[name] as UpgradeMissionMemory;

    if (this.mem.controllerID) {
      const controller = Game.getObjectById(this.mem.controllerID);
      // TODO: handle blind constructio
      this.room = controller ? controller.room! : null;
      this.controller = controller;
    }

    // Purge names of dead/expired creeps
    this.mem.upgraders =
        this.mem.upgraders.filter((cName) => Game.creeps[cName]);
    this.upgraders = this.mem.upgraders.map((cName) => Game.creeps[cName]);
  }

  public setController(controller: StructureController) {
    this.controller = controller;
    this.mem.controllerID = controller.id;
  }

  public setSource(cont: StructureContainer) {
    this.mem.source.structure = cont.id;
  }

  /** Executes one update tick for this mission */
  public run() {
    if (this.mem.controllerID && !Game.getObjectById(this.mem.controllerID)) {
      // Construction complete
      // Remove this mission and deallocate all of the creeps
    }

    // Check for creep allocation
    if (this.needMoreUpgraderss()) {
      this.requestUpgrader();
    }

    // Claim reserved creeps
    this.mem.reservations = this.mem.reservations.filter((reserve) => {
      const creep = Game.creeps[reserve.name];
      if (creep) {
        this.mem.upgraders.push(reserve.name);
        this.upgraders.push(creep);
        return false;
      }
      return true;
    });

    // Determine our source
    // TODO: Only works with sources for now
    const source = Game.getObjectById(this.mem.source.structure!);

    // Direct each creep to mine or build
    this.upgraders.forEach((creep) => {
      if (creep.memory.role === 'upgrader' && creep.store.energy === 0) {
        // Fetch more energy
        creep.memory = {
          containerID: this.mem.source.structure,
          role: 'fetcher',
        };
      } else if (
          creep.memory.role === 'fetcher' &&
          creep.store.getFreeCapacity() === 0) {
        // Have energy, build the structure
        creep.memory = {
          controllerID: this.mem.controllerID!,
          role: 'upgrader',
        };
      }
    });
  }

  private get maxUpgraders() {
    return 5;
  }

  /**
   * Returns true if we need another Harvester.
   *
   * Takes into account total WORK parts of existing harvesters and max
   * harvesters from Source Analysis.
   */
  private needMoreUpgraderss(): boolean {
    if (this.upgraders.length + this.mem.reservations.length >=
        this.maxUpgraders) {
      return false;
    }

    return true;
  }

  private requestUpgrader() {
    // Request another Builder
    const name = this.name + Game.time;
    const res = global.spawnQueue.requestCreep({
      body: this.createHarvesterBody(),
      name,
      options: {
        memory: {
          controllerID: this.mem.controllerID!,
          role: 'upgrader',
        },
      },
      priority: UpgradeMission.spawnPriority,
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
    const upgraders: string[] = Memory.missions[name].upgraders;
    upgraders.forEach((cName) => delete Memory.creeps[cName]);
    delete Memory.missions[name];
    return upgraders;
  }
}
