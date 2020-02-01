import {DISTRIBUTOR, Distributor} from 'behaviors/distributor';
import {ENET_FETCHER, ENetFetcher} from 'behaviors/eNetFetcher';
import {Repairer, REPAIRER} from 'behaviors/repairer';
import {EnergyNode} from 'energy-network/energyNode';
import {ExtensionGroup} from 'layout/extensionGroup';
import {HAULER} from 'spawn-system/bodyTypes';

import {Mission, MissionMemory} from './mission';

interface DistributionMemory extends MissionMemory {
  spawnID: Id<StructureSpawn>|null;
  eNodeFlag: string|null;
  extensionGroups: string[];
}

/**
 * Mission construct to facilitate distributing energy from an EnergyNode to a
 * Spawn or a set of ExtensionGroups.
 *
 * Mission will also repair the Container used by the source Energy Node. This
 * should be removed later.
 */
export class DistributionMission extends Mission<DistributionMemory> {
  protected readonly bodyType = HAULER;
  protected readonly bodyOptions = {};
  protected readonly spawnPriority = 1;

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
      const group = new ExtensionGroup(Game.flags[name]);
      group.init();
      return group;
    });
    return true;
  }

  /** Executes one update tick for this mission */
  public run() {
    if (!this.spawn || !this.eNode) {
      return;
    }
    // Need to do the thinking here, to fill highest priority extensions and
    // repair container
    this.creeps.forEach((distributor) => {
      // First refill the spawn
      if (this.spawn!.energy < this.spawn!.energyCapacity) {
        console.log('assigning distributor to ' + this.spawn!.name);
        if (distributor.memory.behavior !== DISTRIBUTOR) {
          distributor.memory.behavior = DISTRIBUTOR,
          distributor.memory.mem =
              Distributor.initMemory(this.eNode!, this.spawn, null);
          return;
        }
      }

      // Check for empty Extension Groups
      for (const group of this.extensinGroups) {
        if (!group.isFull()) {
          console.log('assigning distributor to ' + group.flag.name);
          if (distributor.memory.behavior !== DISTRIBUTOR) {
            distributor.memory.behavior = DISTRIBUTOR,
            distributor.memory.mem =
                Distributor.initMemory(this.eNode!, null, group);
            return;
          }
        }
      }

      // // Hack: Repair the Energy Node Container
      // const structs = this.eNode!.flag.pos.lookFor(LOOK_STRUCTURES);
      // const container = structs.find((struct) => {
      //   return struct.structureType === STRUCTURE_CONTAINER;
      // }) as StructureContainer;
      // if (container && (container.hitsMax - container.hits) > 100) {
      //   // TODO: This should probably be abstracted into an ENET_REPAIRER
      //   if (distributor.store.energy < 5) {
      //     // Fetch energy from the node
      //     distributor.memory.behavior = ENET_FETCHER;
      //     distributor.memory.mem = ENetFetcher.initMemory(this.eNode!);
      //     distributor.memory.mission = this.name;
      //   } else {
      //     // Repair the container
      //     distributor.memory.behavior = REPAIRER;
      //     distributor.memory.mem = Repairer.initMemory(container);
      //     distributor.memory.mission = this.name;
      //   }
      //   return;
      // }
    });
  }

  private get maxDistributors() {
    return 1;
  }

  /**
   * @override
   * Returns true if we need another Distributor.
   */
  protected needMoreCreeps(): boolean {
    if (this.creeps.length >= this.maxDistributors) {
      return false;
    }

    return true;
  }

  /** @override */
  /** Returns true if we REALLY need another Distributor. */
  protected needMoreCreepsCritical(): boolean {
    return this.creeps.length < 1;
  }

  public static isHealthy(name: string): boolean {
    const mem = Memory.missions[name];

    if (!mem) {
      return false;
    }

    if (mem.creeps.length === 0) {
      return false;
    }

    return true;
  }
}
