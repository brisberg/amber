import {CONTAINER_HARVESTER, ContainerHarvester} from 'behaviors/containerHarvester';
import {DISTRIBUTOR, Distributor} from 'behaviors/distributor';
import {EnergyNode} from 'energy-network/energyNode';
import {ExtensionGroup} from 'layout/extensionGroup';
import {WORKER_1} from 'spawn-system/bodyTypes';

import {MAX_WORK_PER_SOURCE} from '../constants';

import {Mission, MissionMemory} from './mission';

interface DistributionMemory extends MissionMemory {
  spawnID: Id<StructureSpawn>|null;
  eNodeFlag: string|null;
  extensionGroups: string[];
}

/**
 * Mission construct to facilitate harvesting of a single Source.
 *
 * This mission will evaluate the source, decide where to place the storage
 * Container near it. The mission will keep requesting new harvester creeps
 * until there are at least 5 WORK parts at play on the Source.
 */
export class DistributionMission extends Mission<DistributionMemory> {
  protected readonly bodyType: string = WORKER_1;
  protected readonly spawnPriority = 2;

  private eNode: EnergyNode|null = null;
  private spawn: StructureSpawn|null = null;
  private extensinGroups: ExtensionGroup[] = [];

  constructor(flag: Flag) {
    super(flag);
  }

  public setSource(source: EnergyNode) {
    this.eNode = source;
    this.mem.eNodeFlag = source.flag.name;
  }

  public setSpawn(spawn: StructureSpawn) {
    this.spawn = spawn;
    this.mem.spawnID = spawn.id;
  }

  public setExtensionGroups(groups: ExtensionGroup[]) {
    this.extensinGroups = groups;
    this.mem.extensionGroups = groups.map((group) => group.flag.name);
  }

  /** @override */
  protected initialMemory(): DistributionMemory {
    return {
      creeps: [],
      eNodeFlag: null,
      extensionGroups: [],
      spawnID: null,
    };
  }

  /** @override */
  public init(): boolean {
    if (!this.mem.spawnID || !Game.getObjectById(this.mem.spawnID)) {
      return false;
    }
    if (!this.mem.eNodeFlag || !Game.flags[this.mem.eNodeFlag]) {
      return false;
    }

    this.spawn = Game.getObjectById(this.mem.spawnID);
    this.eNode = new EnergyNode(Game.flags[this.mem.eNodeFlag]);
    this.extensinGroups = this.mem.extensionGroups.map((name) => {
      return new ExtensionGroup(Game.flags[name]);
    });
    return true;
  }

  /** Executes one update tick for this mission */
  public run() {
    // Need to do the thinking here, to fill highest priority extensions and
    // repair container
    this.creeps.forEach((distributor) => {
      // Reassign the distributors if they were given to us
      if (distributor.memory.behavior !== DISTRIBUTOR) {
        distributor.memory = {
          ...distributor.memory,
          behavior: DISTRIBUTOR,
          mem: Distributor.initMemory(this.eNode!, this.spawn, null),
          mission: this.name,
        };
      }
    });
  }

  private get maxDistributors() {
    return 1;
  }

  /**
   * @override
   * Returns true if we need another Harvester.
   */
  protected needMoreCreeps(): boolean {
    if (this.creeps.length >= this.maxDistributors) {
      return false;
    }

    return true;
  }
}
