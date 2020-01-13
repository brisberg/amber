import {Upgrader, UPGRADER} from 'behaviors/upgrader';
import {declareOrphan} from 'spawn-system/orphans';
import {SpawnReservation} from 'spawn-system/spawnQueue';
import {createWorkerBody} from 'utils/workerUtils';

interface UpgradeMissionMemory {
  upgraders: string[];
  reservations: SpawnReservation[];
  containerID: Id<StructureContainer>|null;
  controllerID: Id<StructureController>|null;
}

/**
 * Mission construct to facilitate upgrading a single Room Controller.
 *
 * Requires an appropriate Container to exist near the Controller.
 *
 * This mission will coordinate requesting upgrader creeps.
 */
export class UpgradeMission {
  private static spawnPriority = 4;

  public name: string;
  public room: Room|null = null;
  public container: StructureContainer|null = null;
  public controller: StructureController|null = null;

  private upgraders: Creep[] = [];
  private mem: UpgradeMissionMemory;

  constructor(name: string) {
    this.name = name;

    // Init memory
    if (!Memory.missions[name]) {
      const mem: UpgradeMissionMemory = {
        containerID: null,
        controllerID: null,
        reservations: [],
        upgraders: [],
      };
      Memory.missions[name] = mem;
    }
    this.mem = Memory.missions[name] as UpgradeMissionMemory;

    if (this.mem.containerID) {
      this.container = Game.getObjectById(this.mem.containerID);
    }

    if (this.mem.controllerID) {
      const controller = Game.getObjectById(this.mem.controllerID);
      // TODO: handle blind construction
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

  public setContainer(container: StructureContainer) {
    this.container = container;
    this.mem.containerID = container.id;
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

    if (this.container && this.controller) {
      // Direct each creep to upgrade from the sourceNode
      this.upgraders.forEach((creep) => {
        if (creep.memory.behavior !== UPGRADER) {
          // Upgrade controller
          creep.memory = {
            behavior: UPGRADER,
            bodyType: 'worker',
            mem: Upgrader.initMemory(this.controller!, this.container!),
            mission: this.name,
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
      bodyType: 'worker',
      name,
      priority: UpgradeMission.spawnPriority,
    });
    if (res instanceof Creep) {
      res.memory.mission = this.name;
      this.upgraders.push(res);
    } else {
      this.mem.reservations.push(res);
    }
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
    upgraders.forEach((cName) => declareOrphan(Game.creeps[cName]));
    delete Memory.missions[name];
    return upgraders;
  }
}
