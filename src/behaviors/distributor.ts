import {EnergyNode} from 'energy-network/energyNode';
import {ExtensionGroup} from 'layout/extensionGroup';

import {Behavior, BehaviorMemory} from './behavior';
import {DEPOSITER, Depositer} from './depositer';
import {ENET_FETCHER, ENetFetcher} from './eNetFetcher';

interface DistributorMemory extends BehaviorMemory {
  eNodeFlag: string;
  spawnID: Id<StructureSpawn>|null;
  extensionGroup: string|null;
  phase: 'fetch'|'deliver';
}

export const DISTRIBUTOR = 'distributor';

/**
 * Creep behavior class for a single creep to distribute Energy to a
 * Spawn/ExtensionGroup.
 *
 * Takes a creep, a source EnergyNode, and a target Spawn/ExtensionGroup.
 * Handles fetching energy from the Energy Node, and moving to the target Store
 * and transfering in the energy.
 */
export class Distributor extends Behavior<DistributorMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: DistributorMemory) {
    const node = new EnergyNode(Game.flags[mem.eNodeFlag]);
    let spawn: StructureSpawn|null = null;
    if (mem.spawnID) {
      spawn = Game.getObjectById(mem.spawnID);
    }
    let extendGroup: ExtensionGroup|null = null;
    if (mem.extensionGroup) {
      extendGroup = new ExtensionGroup(Game.flags[mem.extensionGroup]);
    }

    if (!node || (!spawn && !extendGroup)) {
      return false;
    }

    if (mem.phase === 'deliver' && creep.store.energy === 0) {
      mem.phase = 'fetch';
      mem.subBehavior = ENET_FETCHER;
      mem.mem = ENetFetcher.initMemory(node);
      return false;
    }

    if (mem.phase === 'fetch' && creep.store.getFreeCapacity() === 0) {
      mem.phase = 'deliver';
      delete mem.subBehavior;
      delete mem.mem;
    }

    if (spawn && spawn.energy < spawn.energyCapacity) {
      mem.subBehavior = DEPOSITER;
      mem.mem = Depositer.initMemory(spawn);
      return false;
    }

    if (extendGroup) {
      if (creep.pos.getRangeTo(extendGroup.flag) > 1) {
        creep.moveTo(extendGroup.flag, {range: 1});
        return true;
      }

      // We are next to the extendGroup flag
      // Interact with the Extend Group to fill it
    }
    return false;
  }

  public static initMemory(
      node: EnergyNode, spawn: StructureSpawn|null = null,
      extendGroup: ExtensionGroup|null = null): DistributorMemory {
    return {
      eNodeFlag: node.flag.name,
      extensionGroup: extendGroup ? extendGroup.flag.name : null,
      phase: 'fetch',
      spawnID: spawn ? spawn.id : null,
    };
  }
}
