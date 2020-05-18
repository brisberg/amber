import {
  EnergyNode,
  registerEnergyNode,
  unregisterEnergyNode,
} from 'energy-network/energyNode';
import {ENERGY_NODE_FLAG, UPGRADE_MISSION_FLAG} from 'flagConstants';

import {UpgradeMission} from '../missions/core/upgrade';

import {
  analyzeControllerForUpgrading,
  UpgradeControllerAnalysis,
} from './upgradeAnalysis';

/**
 * Upgrade Operation
 *
 * This Operation will facilitate all of the sub operations required to upgrade
 * a Controller.
 *
 * It will perform Analysis on a Room Controller, designate where the
 * Container should be placed. It will run a Build missions to get this
 * container constructed. Once the Build is completed, it will scrap that
 * mission and start a new Upgrade mission on the node, and connect up to the
 * Energy Network.
 *
 * This will reassign all the worker from the build to the upgrade.
 */

export interface UpgradeOperationMemory {
  analysis: UpgradeControllerAnalysis|null;
  upgradeMsn: string|null;
  controllerID: Id<StructureController>|null;
  containerID: Id<StructureContainer|ConstructionSite<STRUCTURE_CONTAINER>>|
      null;
  eNodeFlag: string|null;
}

export class UpgradeOperation {
  public readonly name: string;

  private readonly flag: Flag;
  private readonly mem: UpgradeOperationMemory;

  private container: StructureContainer|ConstructionSite<STRUCTURE_CONTAINER>|
      null = null;
  private sourceNode: EnergyNode|null = null;
  private controller: StructureController|null = null;
  private upgradeMsn: UpgradeMission|null = null;

  constructor(flag: Flag) {
    this.name = flag.name;
    this.flag = flag;

    // Init memory
    if (!Memory.operations[this.name]) {
      const mem: UpgradeOperationMemory = {
        analysis: null,
        containerID: null,
        controllerID: null,
        eNodeFlag: null,
        upgradeMsn: null,
      };
      Memory.operations[this.name] = mem;
    }
    this.mem = Memory.operations[this.name] as UpgradeOperationMemory;

    if (this.mem.eNodeFlag) {
      this.sourceNode = new EnergyNode(Game.flags[this.mem.eNodeFlag]);
    }
  }

  public init(): boolean {
    // Validate missions cache
    if (this.mem.upgradeMsn) {
      if (!Game.flags[this.mem.upgradeMsn]) {
        this.mem.upgradeMsn = null;
      } else {
        this.upgradeMsn = new UpgradeMission(Game.flags[this.mem.upgradeMsn]);
      }
    }

    // Validate controller, retire if not found
    if (this.mem.controllerID) {
      const controller = Game.getObjectById(this.mem.controllerID);
      if (!controller) {
        console.log('Upgrade Operation: Controller not found, retiring');
        return false;
      } else {
        this.controller = controller;
      }
    } else {
      // Check at our flag location for the controller
      const conts =
          this.flag.pos.lookFor(LOOK_STRUCTURES)
              .filter(
                  (struct) => struct.structureType === STRUCTURE_CONTROLLER);
      if (conts.length > 0) {
        const controller = conts[0] as StructureController;
        this.mem.controllerID = controller.id;
        this.controller = controller;
      }
    }

    if (!this.controller) {
      return false;
    }

    // Validate ENode cache. Non blocking as we can look for a new one
    if (this.mem.eNodeFlag) {
      const flag = Game.flags[this.mem.eNodeFlag];
      if (!flag) {
        console.log(
            'Upgrade Operation: ENode no longer exists. Clearing cache.');
        this.mem.eNodeFlag = null;
      } else {
        this.sourceNode = new EnergyNode(flag);
      }
    }

    // Validate Container cache
    if (this.mem.containerID) {
      const container = Game.getObjectById(this.mem.containerID);
      if (!container) {
        console.log('Upgrade Operation: Container no longer exists');
        this.mem.containerID = null;
      } else {
        this.container = container;
      }
    }

    return true;
  }

  public run(): void {
    if (!this.controller) {
      return;
    }

    // Run upgrade analysis if we don't have one
    if (!this.mem.analysis) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.mem.analysis = analyzeControllerForUpgrading(this.controller!);
    }

    if (!this.container) {
      // Look for an existing Container or Construction Site at these locations
      const results = this.controller.room.lookAt(
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
        this.controller.room.createConstructionSite(
            this.mem.analysis.containerPos[0],
            this.mem.analysis.containerPos[1], STRUCTURE_CONTAINER);
      }
    }

    if (this.container instanceof StructureContainer) {
      // Attach ourselves to the energy network
      if (!this.mem.eNodeFlag) {
        const flag = registerEnergyNode(
            this.controller.room, [this.container.pos.x, this.container.pos.y],
            {
              color: ENERGY_NODE_FLAG,
              coreBuffer: 1000,
              persistant: true,
              polarity: -10,
              structureID: this.container.id,
              type: 'structure',
            });
        this.mem.eNodeFlag = flag.name;
        this.sourceNode = new EnergyNode(Game.flags[flag.name]);
      }

      if (!this.mem.upgradeMsn && this.sourceNode) {
        // Launch a new Upgrade Mission
        console.log('Launching new Upgrade Mission ' + this.name + '_upgrade');
        const upgradeMsn = this.setUpUpgradeMission(this.name + '_upgrade');
        this.mem.upgradeMsn = upgradeMsn.name;
        upgradeMsn.setController(this.controller);
        upgradeMsn.setContainer(this.container);
      }
    }
  }

  private setUpUpgradeMission(name: string): UpgradeMission {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.controller!.pos.createFlag(
        name, UPGRADE_MISSION_FLAG.color, UPGRADE_MISSION_FLAG.secondaryColor);
    const flag = Game.flags[name];
    return new UpgradeMission(flag);
  }

  private setContainer(container: StructureContainer|
                       ConstructionSite<STRUCTURE_CONTAINER>): void {
    this.container = container;
    this.mem.containerID = container.id;
  }

  public retire(): void {
    console.log('Retiring upgradeOp: ' + this.name);
    if (this.upgradeMsn) {
      this.upgradeMsn.retire();
    }
    if (this.sourceNode) {
      unregisterEnergyNode(this.sourceNode.flag.name);
    }
    this.flag.remove();
    delete Memory.operations[this.name];
  }
}
