/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {setCreepBehavior} from 'behaviors/behavior';
import {DISTRIBUTOR, Distributor} from 'behaviors/distributor';
import {EnergyNode} from 'energy-network/energyNode';
import {ExtensionGroup} from 'layout/extensionGroup';
import {GenerateCreepBodyOptions, HAULER} from 'spawn-system/bodyTypes';

import {Mission, MissionMemory} from '../mission';

interface DistributionMemory extends MissionMemory {
  spawnIDs: Array<Id<StructureSpawn>>;
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
  // Limited to size of a RCL7 Extension Group
  protected readonly bodyOptions: GenerateCreepBodyOptions = {max: {carry: 12}};
  protected readonly spawnPriority = 1;

  private eNode: EnergyNode|null = null;
  private spawns: StructureSpawn[] = [];
  private extensinGroups: ExtensionGroup[] = [];
  private towers: StructureTower[] = [];

  constructor(flag: Flag) {
    super(flag);
  }

  public setSource(source: EnergyNode): void {
    this.eNode = source;
    this.mem.eNodeFlag = source.flag.name;
  }

  public setSpawns(spawns: StructureSpawn[]): void {
    this.spawns = spawns;
    this.mem.spawnIDs = spawns.map((spawn) => spawn.id);
  }

  public setExtensionGroups(groups: ExtensionGroup[]): void {
    this.extensinGroups = groups;
    this.mem.extensionGroups = groups.map((group) => group.flag.name);
  }

  public setTowers(towers: StructureTower[]): void {
    this.towers = towers;
    this.mem.towerIDs = towers.map((tower) => tower.id);
  }

  /** @override */
  protected initialMemory(): DistributionMemory {
    return {
      creeps: [],
      eNodeFlag: null,
      extensionGroups: [],
      spawnIDs: [],
      towerIDs: [],
    };
  }

  /** @override */
  public init(): boolean {
    if (!this.mem.eNodeFlag || !Game.flags[this.mem.eNodeFlag]) {
      return false;
    }

    this.spawns = this.room!.find(FIND_MY_SPAWNS);
    this.mem.spawnIDs = this.spawns.map((spawn) => spawn.id);
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
  public run(): void {
    if (this.spawns.length === 0 || !this.eNode) {
      return;
    }

    this.creeps.forEach((distributor) => {
      distributor.memory.mission = this.name;

      if (distributor.memory.behavior !== DISTRIBUTOR) {
        setCreepBehavior(
            distributor, DISTRIBUTOR,
            Distributor.initMemory(this.eNode!, null, null));
        return;
      }

      // Only reassign distributors who are idle
      if (distributor.memory.mem.phase === 'idle') {
        // First refill towers
        for (const tower of this.towers) {
          if (tower.energy < tower.energyCapacity) {  // Towers have weird store
            setCreepBehavior(
                distributor, DISTRIBUTOR,
                Distributor.initMemory(this.eNode!, null, null, tower));
            return;
          }
        }

        // Refill the spawn
        for (const spawn of this.spawns) {
          if (spawn.energy < spawn.energyCapacity) {
            setCreepBehavior(
                distributor, DISTRIBUTOR,
                Distributor.initMemory(this.eNode!, spawn, null, null));
            return;
          }
        }

        // Check for empty Extension Groups
        for (const group of this.extensinGroups) {
          if (!group.isFull()) {
            setCreepBehavior(
                distributor, DISTRIBUTOR,
                Distributor.initMemory(this.eNode!, null, group, null));
            return;
          }
        }
      }
    });
  }

  private get maxDistributors(): number {
    return 1;
  }

  /**
   * @override
   * Returns true if we need another Distributor.
   */
  protected needMoreCreeps(): boolean {
    if (this.getYoungCreeps().length >= this.maxDistributors) {
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
