import {CONTAINER_UPGRADER, ContainerUpgrader} from 'behaviors/containerUpgrader';
import {WORKER_1} from 'spawn-system/bodyTypes';

import {Mission, MissionMemory} from './mission';

interface UpgradeMissionMemory extends MissionMemory {
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
export class UpgradeMission extends Mission<UpgradeMissionMemory> {
  protected readonly spawnPriority = 5;
  protected readonly bodyType = WORKER_1;

  private container: StructureContainer|null = null;
  private controller: StructureController|null = null;

  constructor(flag: Flag) {
    super(flag);
  }

  protected initialMemory(): UpgradeMissionMemory {
    return {
      containerID: null,
      controllerID: null,
      creeps: [],
    };
  }

  public init(): boolean {
    if (!this.mem.containerID || !Game.getObjectById(this.mem.containerID)) {
      console.log('Upgrade Mission: Container Missing. Retiring');
      return false;
    }

    if (!this.mem.controllerID || !Game.getObjectById(this.mem.controllerID)) {
      console.log('Upgrade Mission: Controller Missing. Retiring');
      return false;
    }

    this.container = Game.getObjectById(this.mem.containerID);
    this.controller = Game.getObjectById(this.mem.controllerID);
    return true;
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

    if (this.container && this.controller) {
      // Direct each creep to upgrade from the sourceNode
      this.creeps.forEach((creep) => {
        if (creep.memory.behavior !== CONTAINER_UPGRADER) {
          // Upgrade controller
          creep.memory = {
            behavior: CONTAINER_UPGRADER,
            bodyType: WORKER_1,
            mem: ContainerUpgrader.initMemory(
                this.controller!,
                this.container!,
                ),
            mission: this.name,
          };
        }
      });
    }
  }

  private get maxUpgraders() {
    return 6;
  }

  /**
   * @override
   * Returns true if we need another Harvester.
   *
   * Takes into account total WORK parts of existing harvesters and max
   * harvesters from Source Analysis.
   */
  protected needMoreCreeps(): boolean {
    if (this.creeps.length >= this.maxUpgraders) {
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
