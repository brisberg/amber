import {EnergyNode, registerEnergyNode, unregisterEnergyNode} from 'energy-network/energyNode';
import {BUILD_TARGET_FLAG_COLOR, ENERGY_NODE_FLAG_COLOR} from 'flagConstants';
import {TransportMission} from 'missions/transport';

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
  transportMsn: string|null;
  upgradeMsn: string|null;
  controllerID: Id<StructureController>;
  containerID: Id<StructureContainer|ConstructionSite<STRUCTURE_CONTAINER>>|
      null;
  eNodeFlag: string|null;
  buildENodeFlag: string|null;
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
        buildENodeFlag: null,
        buildMsn: null,
        containerID: null,
        controllerID: controller.id,
        eNodeFlag: null,
        transportMsn: null,
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
      // Search for the nearest permanent Energy Node
      const eNodeFlag = this.container.pos.findClosestByPath(
          FIND_FLAGS,
          {filter: {color: ENERGY_NODE_FLAG_COLOR}},
      );
      if (eNodeFlag) {
        const path = eNodeFlag.pos.findPathTo(this.container);
        const dropPoint =
            path[path.length - 3];  // Handoff two steps from target
        const handoff = registerEnergyNode(
            this.room,
            [dropPoint.x, dropPoint.y],
            {
              persistant: false,
              threshold: 200,
              type: 'creep',
            },
        );
        // Set up a transport mission to bring energy to us
        const transportMsn = new TransportMission(this.name + '_supply');
        transportMsn.setSource(new EnergyNode(eNodeFlag));
        transportMsn.setDestination(new EnergyNode(handoff));
        transportMsn.setThroughput(30);
        this.mem.transportMsn = transportMsn.name;
        console.log('build enode setiing: ' + handoff.name);
        this.mem.buildENodeFlag = handoff.name;
        // Set up the build mission to construct the storage container
        const buildMsnName = this.name + '_build';
        this.container.pos.createFlag(buildMsnName, BUILD_TARGET_FLAG_COLOR);
        const buildMsn = new BuildMission(Game.flags[buildMsnName]);
        buildMsn.setTargetSite(this.container);
        buildMsn.setEnergyNode(new EnergyNode(handoff));
        buildMsn.setMaxBuilders(3);
        this.mem.buildMsn = buildMsn.name;
      }
    } else if (this.container instanceof StructureContainer) {
      // Attach ourselves to the energy network
      if (!this.mem.eNodeFlag) {
        const flag = registerEnergyNode(
            this.room, [this.container.pos.x, this.container.pos.y], {
              persistant: true,
              structureID: this.container.id,
              threshold: 1500,  // Keep us supplied
              type: 'structure',
            });
        this.mem.eNodeFlag = flag.name;
        this.sourceNode = new EnergyNode(Game.flags[flag.name]);
      }

      // Cleanup the build mission
      if (this.mem.buildMsn) {
        console.log('Cleaning up build mission ' + this.mem.buildMsn);
        // BuildMission.ret(this.mem.buildMsn);
        this.mem.buildMsn = null;
      }

      // Cleanup the Transport missions
      if (this.mem.transportMsn) {
        console.log('Cleaning up build mission ' + this.mem.buildMsn);
        const handoffENode = Game.flags[this.mem.buildENodeFlag!];
        TransportMission.cleanup(this.mem.transportMsn);
        this.mem.transportMsn = null;
        console.log('    Removing Builder ENode ' + this.mem.buildENodeFlag);
        unregisterEnergyNode(handoffENode);
      }

      if (!this.mem.upgradeMsn && this.sourceNode) {
        // Launch a new Upgrade Mission
        console.log('Launching new Upgrade Mission ' + this.name + '_upgrade');
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
