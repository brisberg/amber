import {DISTRIBUTOR, Distributor} from 'behaviors/distributor';
import {EnergyNode} from 'energy-network/energyNode';
import {ExtensionGroup} from 'layout/extensionGroup';
import {HAULER} from 'spawn-system/bodyTypes';

import {Mission, MissionMemory} from './mission';

interface DistributionMemory extends MissionMemory {
  spawnID: Id<StructureSpawn>|null;
  eNodeFlag: string|null;
  extensionGroups: string[];
  towerIDs: Array<Id<StructureTower>>;
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
  private towers: StructureTower[] = [];

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

  public setTowers(towers: StructureTower[]) {
    this.towers = towers;
    this.mem.towerIDs = towers.map((tower) => tower.id);
  }

  /** @override */
  protected initialMemory(): DistributionMemory {
    return {
      creeps: [],
      eNodeFlag: null,
      extensionGroups: [],
      spawnID: null,
      towerIDs: [],
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
    this.towers = this.mem.towerIDs
                      .filter((id) => {
                        return Game.getObjectById(id);
                      })
                      .map((id) => {
                        return Game.getObjectById(id)!;
                      });
    return true;
  }

  /** Executes one update tick for this mission */
  public run() {
    if (!this.spawn || !this.eNode) {
      return;
    }

    this.creeps.forEach((distributor) => {
      distributor.memory.mission = this.name;

      if (distributor.memory.behavior !== DISTRIBUTOR) {
        distributor.memory.behavior = DISTRIBUTOR;
        distributor.memory.mem =
            Distributor.initMemory(this.eNode!, null, null);
        return;
      }

      // Only reassign distributors who are idle
      if (distributor.memory.mem.phase === 'idle') {
        // First refill towers
        for (const tower of this.towers) {
          if (tower.energy < tower.energyCapacity) {  // Towers have weird store
            distributor.memory.mem =
                Distributor.initMemory(this.eNode!, null, null, tower);
            return;
          }
        }

        // Refill the spawn
        if (this.spawn!.energy < this.spawn!.energyCapacity) {
          distributor.memory.mem =
              Distributor.initMemory(this.eNode!, this.spawn, null, null);
          return;
        }

        // Check for empty Extension Groups
        for (const group of this.extensinGroups) {
          if (!group.isFull()) {
            distributor.memory.mem =
                Distributor.initMemory(this.eNode!, null, group, null);
            return;
          }
        }
      }
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
