import {ExtensionGroup} from 'layout/extensionGroup';
import {DistributionMission} from 'missions/core/distribution';
import {ManagerMission} from 'missions/core/manager';

import {EnergyNode} from '../energy-network/energyNode';
import {
  CORE_ENERGY_NODE_FLAG,
  DISTRIBUTION_MISSION_FLAG,
  EXTENSION_GROUP_A_FLAG,
  EXTENSION_GROUP_B_FLAG,
  MANAGER_MISSION_FLAG,
} from '../flagConstants';

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
  distMsn: string|null;     // Distribution Mission
  managerMsn: string|null;  // Manager Mission
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
  private managerMsn: ManagerMission|null = null;
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
        managerMsn: null,
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
    if (this.mem.managerMsn) {
      if (!Game.flags[this.mem.managerMsn]) {
        this.mem.managerMsn = null;
      } else {
        this.managerMsn = new ManagerMission(Game.flags[this.mem.managerMsn]);
      }
    }

    // Validate Spawns cache
    const spawnNames = this.mem.spawnIDs.filter((spawn) => {
      return !!Game.getObjectById(spawn);
    });
    this.mem.spawnIDs = spawnNames;
    this.spawns = spawnNames.map((spawn) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return Game.getObjectById(spawn)!;
    });

    if (this.spawns.length === 0) {
      // Check for spawns in our room
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return Game.getObjectById(id)!;
    });

    return true;
  }

  public run(): void {
    if (this.spawns.length === 0 || !this.eNode) {
      return;
    }

    // Aquire new ExtenionGroups as they appear
    const groupAFlags =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.flag.room!.find(FIND_FLAGS, {filter: EXTENSION_GROUP_A_FLAG});
    const groupBFlags =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.flag.room!.find(FIND_FLAGS, {filter: EXTENSION_GROUP_B_FLAG});
    const groupNames = groupAFlags.concat(groupBFlags).map((flag) => flag.name);
    this.mem.extensionFlags = groupNames;
    this.extensionGroups = groupNames.map((flag) => {
      return new ExtensionGroup(Game.flags[flag]);
    });

    // Aquire new Towers as they appear
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (!this.managerMsn && this.flag.room!.controller!.level >= 5) {
      const link =
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.flag.room!
              .find(
                  FIND_MY_STRUCTURES,
                  {filter: (s): boolean => s.structureType === STRUCTURE_LINK},
                  )
              .shift();
      if (link) {  // Set up a Manager mission to supply link with energy
        const managerMsn = this.setUpManagerMission(this.name + '_man');
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        managerMsn.setStorage(this.flag.room!.storage!);
        managerMsn.setLink(link as StructureLink);
        managerMsn.init();
        this.mem.managerMsn = managerMsn.name;
      }
    }
  }

  private setUpDistributionMission(name: string): DistributionMission {
    this.flag.pos.createFlag(
        name, DISTRIBUTION_MISSION_FLAG.color,
        DISTRIBUTION_MISSION_FLAG.secondaryColor);
    const flag = Game.flags[name];
    return new DistributionMission(flag);
  }

  private setUpManagerMission(name: string): ManagerMission {
    // One cell above the storage
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const pos = this.flag.room!.getPositionAt(
        this.flag.pos.x,
        this.flag.pos.y - 1,
    );
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    pos!.createFlag(
        name, MANAGER_MISSION_FLAG.color, MANAGER_MISSION_FLAG.secondaryColor);
    const flag = Game.flags[name];
    return new ManagerMission(flag);
  }

  public setSpawns(spawns: StructureSpawn[]): void {
    this.spawns = spawns;
    this.mem.spawnIDs = spawns.map((spawn) => spawn.id);
  }

  public setSource(node: EnergyNode): void {
    this.eNode = node;
    this.mem.eNodeFlag = node.flag.name;
  }

  public retire(): void {
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
