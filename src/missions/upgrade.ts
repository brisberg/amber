import {EnergyNode} from 'energy-network/energyNode';
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
  sourceNodeFlag: string|null;
  controllerID: Id<StructureController>|null;
}

/**
 * Mission construct to facilitate upgrading a single room controller.
 *
 * This mission will coordinate requesting upgrader creeps, and can specify
 * several sources for the energy.
 */
export class UpgradeMission {
  private static spawnPriority = 4;

  public name: string;
  public room: Room|null = null;
  public sourceNode: EnergyNode|null = null;
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
        sourceNodeFlag: null,
        upgraders: [],
      };
      Memory.missions[name] = mem;
    }
    this.mem = Memory.missions[name] as UpgradeMissionMemory;

    // Energy Source Node
    if (this.mem.sourceNodeFlag) {
      this.sourceNode = new EnergyNode(Game.flags[this.mem.sourceNodeFlag]);
    }

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

  public setSource(node: EnergyNode) {
    this.sourceNode = node;
    this.mem.sourceNodeFlag = node.flag.name;
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

    if (this.sourceNode) {
      // Direct each creep to upgrade from the sourceNode
      this.upgraders.forEach((creep) => {
        if (creep.memory.role !== 'upgrader') {
          // Upgrade controller
          creep.memory = {
            controllerID: this.mem.controllerID!,
            eNodeFlag: this.mem.sourceNodeFlag!,
            role: 'upgrader',
          };
        }
      });
    }
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
