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
      extendGroup.init();
    }

    if (!node || (!spawn && !extendGroup)) {
      return false;
    }

    // Deliver State
    if (mem.phase === 'deliver') {
      if (creep.store.energy < 5) {
        // Out of energy, go to fetch phase
        mem.phase = 'fetch';
        return false;
      }

      if (spawn && spawn.energy < spawn.energyCapacity) {
        mem.subBehavior = DEPOSITER;
        mem.mem = Depositer.initMemory(spawn);
        return false;
      }

      if (extendGroup) {
        if (creep.pos.getRangeTo(extendGroup.flag) > 1) {
          creep.moveTo(extendGroup.flag);
          return true;
        }

        // We are next to the extendGroup flag
        // Interact with the Extend Group to fill it
        const extend = extendGroup.getNextExtension();
        if (extend) {
          mem.subBehavior = DEPOSITER;
          mem.mem = Depositer.initMemory(extend);
          return false;
        }
      }
    } else if (mem.phase === 'fetch') {  // Fetch state
      if (creep.store.getFreeCapacity() === 0) {
        // We are full, go to deliver
        mem.phase = 'deliver';
        return false;
      }

      mem.subBehavior = ENET_FETCHER;
      mem.mem = ENetFetcher.initMemory(node);
      return false;
    }

    return false;
  }

  public static initMemory(
      node: EnergyNode, spawn: StructureSpawn|null = null,
      extendGroup: ExtensionGroup|null = null): DistributorMemory {
    return {
      eNodeFlag: node.flag.name,
      extensionGroup: extendGroup ? extendGroup.flag.name : null,
      phase: 'deliver',
      spawnID: spawn ? spawn.id : null,
    };
  }
}
