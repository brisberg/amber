import {EnergyNode, registerEnergyNode} from 'energy-network/energyNode';

import {BuildMission} from '../missions/build';
import {UpgradeMission} from '../missions/upgrade';
import {analyzeControllerForUpgrading, UpgradeControllerAnalysis} from './upgradeAnalysis';

/**
 * Upgrade Operation
 *
 * This Operation will facilitate all of the sub operations required to set up a
 * upgrade controller operation.
 *
 * It will perform Analysis on a Room Controller, designate where the
 * Container should be placed. It will run a Build missions to get this
 * container constructed. Once the Build is completed, it will scrap that
 * mission and start a new Harvest mission on the node, and connect up to the
 * Energy Network.
 *
 * This will reassign all the worker from the build to the upgrade.
 */

export interface UpgradeOperationMemory {
  analysis: UpgradeControllerAnalysis|null;
  buildMsn: string|null;
  upgradeMsn: string|null;
  controllerID: Id<StructureController>;
  containerID: Id<StructureContainer|ConstructionSite<STRUCTURE_CONTAINER>>|
      null;
  eNodeFlag: string|null;
}

export class UpgradeOperation {
  private readonly name: string;
  private readonly room: Room;
  private readonly controller: StructureController;
  private readonly mem: UpgradeOperationMemory;

  private container: StructureContainer|ConstructionSite<STRUCTURE_CONTAINER>|
      null = null;
  private sourceNode: EnergyNode|null = null;

  constructor(name: string, controller: StructureController) {
    this.name = name;
    this.room = controller.room;
    this.controller = controller;

    // Init memory
    if (!Memory.operations[name]) {
      const mem: UpgradeOperationMemory = {
        analysis: null,
        buildMsn: null,
        containerID: null,
        controllerID: controller.id,
        eNodeFlag: null,
        upgradeMsn: null,
      };
      Memory.operations[name] = mem;
    }
    this.mem = Memory.operations[name] as UpgradeOperationMemory;

    if (this.mem.eNodeFlag) {
      this.sourceNode = new EnergyNode(Game.flags[this.mem.eNodeFlag]);
    }
  }

  public run() {
    // Run upgrade analysis if we don't have one
    if (!this.mem.analysis) {
      this.mem.analysis = analyzeControllerForUpgrading(this.controller);
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

    if (this.container instanceof ConstructionSite && !this.mem.buildMsn) {
      // Build Phase
      const buildMsn = new BuildMission(this.name + '_build');
      buildMsn.setTargetSite(this.container);
      // buildMsn.setEnergyNode(this.sourceNode!);
      this.mem.buildMsn = buildMsn.name;
    } else if (this.container instanceof StructureContainer) {
      // Attack ourselves to the enrgy network
      if (!this.mem.eNodeFlag) {
        const flag = registerEnergyNode(
            this.room, [this.container.pos.x, this.container.pos.y], {
              persistant: true,
              polarity: -30,
              structureID: this.container.id,
              type: 'structure',
            });
        this.mem.eNodeFlag = flag.name;
        this.sourceNode = new EnergyNode(Game.flags[flag.name]);
      }

      // Transfer Phase
      if (this.mem.buildMsn && !this.mem.upgradeMsn && this.sourceNode) {
        // Cleanup the build missions and reassign all creeps to the new Harvest
        // missions
        const creeps = BuildMission.cleanup(this.mem.buildMsn);
        this.mem.buildMsn = null;
        const upgradeMsn = new UpgradeMission(this.name + '_upgrade');
        this.mem.upgradeMsn = upgradeMsn.name;
        upgradeMsn.setController(this.controller);
        upgradeMsn.setContainer(this.container);
        // Transfer the creeps as upgraders to the upgrade mission
        Memory.missions[upgradeMsn.name].upgraders = creeps;
      } else if (!this.mem.upgradeMsn && this.sourceNode) {
        const upgradeMsn = new UpgradeMission(this.name + '_upgrade');
        this.mem.upgradeMsn = upgradeMsn.name;
        upgradeMsn.setController(this.controller);
        upgradeMsn.setContainer(this.container);
      }
    }
  }

  private setContainer(container: StructureContainer|
                       ConstructionSite<STRUCTURE_CONTAINER>) {
    this.container = container;
    this.mem.containerID = container.id;
  }
}
