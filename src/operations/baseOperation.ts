import {ExtensionGroup} from 'layout/extensionGroup';
import {DistributionMission} from 'missions/distribution';

import {EnergyNode} from '../energy-network/energyNode';
import {CORE_ENERGY_NODE_FLAG, DISTRIBUTION_MISSION_FLAG, EXTENSION_GROUP_A_FLAG, EXTENSION_GROUP_B_FLAG} from '../flagConstants';

/**
 * Base Operation
 *
 * This Operation will layout groups of extensions around a given spawn.
 *
 * It must be given an Energy node (usually the CoreNode but not necessary),
 * from which it will draw energy to fill the spawn.
 *
 * Following the RCL of the room, it will create a number of Extension Groups
 * near the spawn. For now, this will be hardcoded.
 *
 * Note: Might want to rename this, as "Base" sounds like a Base Class.
 */

export interface BaseOperationMemory {
  distMsn: string|null;  // Distribution Mission
  spawnIDs: Array<Id<StructureSpawn>>;
  townSquareFlag: string|null;
  extensionFlags: string[];
  towerIDs: Array<Id<StructureTower>>;
  eNodeFlag: string|null;  // Cached Energy Node as Operation source
}

export class BaseOperation {
  public readonly name: string;

  private readonly flag: Flag;
  private readonly mem: BaseOperationMemory;

  private spawns: StructureSpawn[] = [];
  private distMsn: DistributionMission|null = null;
  private extensionGroups: ExtensionGroup[] = [];
  private towers: StructureTower[] = [];
  private eNode: EnergyNode|null = null;

  constructor(flag: Flag) {
    this.name = flag.name;
    this.flag = flag;

    // Init memory
    if (!Memory.operations[this.name]) {
      const mem: BaseOperationMemory = {
        distMsn: null,
        eNodeFlag: null,
        extensionFlags: [],
        spawnIDs: [],
        towerIDs: [],
        townSquareFlag: null,
      };
      Memory.operations[this.name] = mem;
    }
    this.mem = Memory.operations[this.name] as BaseOperationMemory;
  }

  public init(): boolean {
    // Validate missions cache
    if (this.mem.distMsn) {
      if (!Game.flags[this.mem.distMsn]) {
        this.mem.distMsn = null;
      } else {
        this.distMsn = new DistributionMission(Game.flags[this.mem.distMsn]);
      }
    }

    // Validate Spawns cache
    const spawnNames = this.mem.spawnIDs.filter((spawn) => {
      return Game.getObjectById(spawn) !== undefined;
    });
    this.mem.spawnIDs = spawnNames;
    this.spawns = spawnNames.map((spawn) => {
      return Game.getObjectById(spawn)!;
    });

    if (this.spawns.length === 0) {
      // Check for spawns in our room
      const spawns = this.flag.room!.find(FIND_MY_SPAWNS);
      if (spawns.length > 0) {
        this.spawns = spawns;
        this.mem.spawnIDs = spawns.map((spawn) => spawn.id);
      } else {
        console.log('Base Operation: Spawn no longer exists. Retiring.');
        return false;
      }
    }

    // Validate ENode cache. Non blocking as we can look for a new one
    if (this.mem.eNodeFlag) {
      const flag = Game.flags[this.mem.eNodeFlag];
      if (!flag) {
        console.log('Base Operation: ENode no longer exists. Retiring');
        this.mem.eNodeFlag = null;
        return false;
      } else {
        this.eNode = new EnergyNode(flag);
      }
    } else {
      const coreNodes =
          this.flag.room!.find(FIND_FLAGS, {filter: CORE_ENERGY_NODE_FLAG});
      if (coreNodes.length > 0) {
        this.eNode = new EnergyNode(coreNodes[0]);
        this.mem.eNodeFlag = coreNodes[0].name;
      }
    }

    // Validate Entension Groups. Non blocking as we can spawn more
    const groupNames = this.mem.extensionFlags.filter((flag) => {
      return Game.flags[flag] !== undefined;
    });
    this.extensionGroups = groupNames.map((flag) => {
      return new ExtensionGroup(Game.flags[flag]);
    });

    // Validate Towers. Non blocking as we can build
    const towerIds = this.mem.towerIDs.filter((id) => {
      return Game.getObjectById(id) !== null;
    });
    this.towers = towerIds.map((id) => {
      return Game.getObjectById(id)!;
    });

    return true;
  }

  public run() {
    if (this.spawns.length === 0 || !this.eNode) {
      return;
    }

    // Aquire new ExtenionGroups as they appear
    const groupAFlags =
        this.flag.room!.find(FIND_FLAGS, {filter: EXTENSION_GROUP_A_FLAG});
    const groupBFlags =
        this.flag.room!.find(FIND_FLAGS, {filter: EXTENSION_GROUP_B_FLAG});
    const groupNames = groupAFlags.concat(groupBFlags).map((flag) => flag.name);
    this.mem.extensionFlags = groupNames;
    this.extensionGroups = groupNames.map((flag) => {
      return new ExtensionGroup(Game.flags[flag]);
    });

    // Aquire new Towers as they appear
    const towers = this.flag.room!.find(
        FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
    const towerIDs = towers.map((tower) => tower.id as Id<StructureTower>);
    this.mem.towerIDs = towerIDs;
    this.towers = towers as StructureTower[];

    if (!this.distMsn) {
      // Set up a Distribution mission to supply spawn/extensions
      const distMsn = this.setUpDistributionMission(this.name + '_dist');
      distMsn.setSource(this.eNode);
      distMsn.setSpawns(this.spawns);
      distMsn.setExtensionGroups(this.extensionGroups);
      distMsn.setTowers(this.towers);
      distMsn.init();
      this.mem.distMsn = distMsn.name;
    } else {
      // Update existing Distribution mission with new extension groups
      this.distMsn.setSpawns(this.spawns);
      this.distMsn.setExtensionGroups(this.extensionGroups);
      this.distMsn.setTowers(this.towers);
    }
  }

  private setUpDistributionMission(name: string) {
    this.flag.pos.createFlag(
        name, DISTRIBUTION_MISSION_FLAG.color,
        DISTRIBUTION_MISSION_FLAG.secondaryColor);
    const flag = Game.flags[name];
    return new DistributionMission(flag);
  }

  public setSpawns(spawns: StructureSpawn[]) {
    this.spawns = spawns;
    this.mem.spawnIDs = spawns.map((spawn) => spawn.id);
  }

  public setSource(node: EnergyNode) {
    this.eNode = node;
    this.mem.eNodeFlag = node.flag.name;
  }

  public retire() {
    console.log('Retiring Base Operation: ' + this.name);
    if (this.distMsn) {
      this.distMsn.retire();
    }
    this.flag.remove();
    delete Memory.operations[this.name];
  }

  public isHealthy(): boolean {
    if (this.spawns.length === 0) {
      return false;
    }

    if (!this.mem.distMsn) {
      return false;
    }

    if (!DistributionMission.isHealthy(this.mem.distMsn)) {
      return false;
    }

    return true;
  }
}
