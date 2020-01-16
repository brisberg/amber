import {ExtensionGroup} from 'layout/extensionGroup';
import {DistributionMission} from 'missions/distribution';

import {EnergyNode} from '../energy-network/energyNode';
import {DISTRIBUTION_MISSION_FLAG, EXTENSION_GROUP_FLAG} from '../flagConstants';

/**
 * Base Operation
 *
 * This Operation will layout groups of extensions around a given spawn.
 *
 * It must be given an Energy node (usually the CoreNode but not necessary),
 * from which it will draw energy to fill the spawn.
 *
 * Following the RCL of the
 * room, it will create a number of Extension Groups near the spawn. For now,
 * this will be laregly themselves.
 *
 * Note: Might want to rename this, as "Base" sounds like a Base Class.
 */

export interface BaseOperationMemory {
  distMsn: string|null;  // Distribution Mission
  spawnID: Id<StructureSpawn>|null;
  extensionFlags: string[];
  eNodeFlag: string|null;  // Cached Energy Node as Operation source
}

export class BaseOperation {
  public readonly name: string;

  private readonly flag: Flag;
  private readonly mem: BaseOperationMemory;

  private spawn: StructureSpawn|null = null;
  private distMsn: DistributionMission|null = null;
  private extensionGroups: ExtensionGroup[] = [];
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
        spawnID: null,
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
        // this.distMsn = new
        // DistributionMission(Game.flags[this.mem.distMsn]);
      }
    }

    // Validate Spawn cache
    if (this.mem.spawnID) {
      const spawn = Game.getObjectById(this.mem.spawnID);
      if (!spawn) {
        console.log('Base Operation: Spawn no longer exists. Retiring.');
        this.mem.spawnID = null;
        return false;
      } else {
        this.spawn = spawn;
      }
    }

    // Validate ENode cache. Non blocking as we can look for a new one
    if (this.mem.eNodeFlag) {
      const flag = Game.flags[this.mem.eNodeFlag];
      if (!flag) {
        console.log('Build Operation: ENode no longer exists. Retiring');
        this.mem.eNodeFlag = null;
        return false;
      } else {
        this.eNode = new EnergyNode(flag);
      }
    }

    // Validate Entension Groups. Non blocking as we can spawn more
    const groupNames = this.mem.extensionFlags.filter((flag) => {
      return Game.flags[flag] !== undefined;
    });
    this.extensionGroups = groupNames.map((flag) => {
      return new ExtensionGroup(Game.flags[flag]);
    });

    return true;
  }

  public run() {
    if (!this.spawn || !this.eNode) {
      return;
    }

    const maxExtensionGroups =
        CONTROLLER_STRUCTURES.extension[this.spawn.room.controller!.level] / 5;
    if (this.extensionGroups.length < maxExtensionGroups) {
      // Spawn another group
      const pos = this.spawn.room.getPositionAt(
          this.spawn.pos.x + 3,
          this.spawn.pos.y,
      );
      pos!.createFlag(
          this.name + '_entend_' + this.extensionGroups.length,
          EXTENSION_GROUP_FLAG.color, EXTENSION_GROUP_FLAG.secondaryColor);
      // const group = new ExtensionGroup()
    }

    if (!this.distMsn) {
      // Set up a Distribution mission to supply spawn/extensions
      const distMsn = this.setUpDistributionMission(this.name + '_dist');
      distMsn.setSource(this.eNode);
      distMsn.setSpawn(this.spawn);
      distMsn.setExtensionGroups(this.extensionGroups);
      distMsn.init();
      this.mem.distMsn = distMsn.name;
    } else {
      // Update existing Distribution mission with new extension groups
      this.distMsn.setSpawn(this.spawn);
      this.distMsn.setExtensionGroups(this.extensionGroups);
    }
  }

  private setUpDistributionMission(name: string) {
    this.spawn!.pos.createFlag(
        name, DISTRIBUTION_MISSION_FLAG.color,
        DISTRIBUTION_MISSION_FLAG.secondaryColor);
    const flag = Game.flags[name];
    return new DistributionMission(flag);
  }

  public setSpawn(spawn: StructureSpawn) {
    this.spawn = spawn;
    this.mem.spawnID = spawn.id;
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
}
