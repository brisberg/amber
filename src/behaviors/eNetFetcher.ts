import {EnergyNode} from '../energy-network/energyNode';

import {Behavior, BehaviorMemory} from './behavior';

interface ENetFetcherMemory extends BehaviorMemory {
  eNodeFlag: string;
}

export const ENET_FETCHER = 'enet-fetcher';

/**
 * Creep behavior class for a single creep to fetch energy from an Energy Node
 * on the Energy Network.
 *
 * Takes a creep and an Energy Node. Handles moving the creep
 * towards the target and withdrawing from it.
 */
export class ENetFetcher extends Behavior<ENetFetcherMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: ENetFetcherMemory) {
    const node = new EnergyNode(Game.flags[mem.eNodeFlag]);

    if (node) {
      if (!creep.pos.inRangeTo(node.flag.pos, 1)) {
        creep.moveTo(node.flag.pos);
        return true;
      }

      // We have arrived

      // Withdraw from the node
      node.transferTo(creep);
      return false;
    }
    return false;
  }

  public static initMemory(node: EnergyNode): ENetFetcherMemory {
    return {
      eNodeFlag: node.flag.name,
    };
  }
}
