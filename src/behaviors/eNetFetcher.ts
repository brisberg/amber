import {EnergyNode} from '../energy-network/energyNode';

import {Behavior, BehaviorMemory} from './behavior';

interface ENetFetcherMemory extends BehaviorMemory {
  eNodeFlag: string;
  buffer: number;  // Min amount of energy to leave in Target
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
  protected behaviorActions(creep: Creep, mem: ENetFetcherMemory): boolean {
    const node = new EnergyNode(Game.flags[mem.eNodeFlag]);

    if (node && node.getStoredEnergy() >= mem.buffer) {
      if (!creep.pos.inRangeTo(node.flag.pos, 1)) {
        creep.moveTo(node.flag.pos, {
          costCallback: (roomname, costMatrix) => {
            // Hack for season instance to avoid a hostil room
            if (roomname === 'E7S28') {
              for (let i = 0; i < 50; i++) {
                // North exit is unwalkable
                costMatrix.set(i, 0, 255);
              }
            }

            return costMatrix;
          },
        });
        return true;
      }

      // We have arrived

      // Withdraw from the node
      node.transferTo(creep);
      return false;
    }
    return false;
  }

  public static initMemory(node: EnergyNode, buffer: number):
      ENetFetcherMemory {
    return {
      buffer,
      eNodeFlag: node.flag.name,
    };
  }

  public static getTarget(mem: ENetFetcherMemory): string|null {
    if (!mem) {
      return null;
    }

    return mem.eNodeFlag;
  }
}
