import {EnergyNode} from '../energy-network/energyNode';

import {Behavior, BehaviorMemory} from './behavior';

interface ENetDepositerMemory extends BehaviorMemory {
  eNodeFlag: string;
}

export const ENET_DEPOSITER = 'enet-depositer';

/**
 * Creep behavior class for a single creep to deposit energy into an Energy Node
 * on the Energy Network.
 *
 * Takes a creep and an Energy Node. Handles moving the creep
 * towards the target and transfering to it.
 */
export class ENetDepositer extends Behavior<ENetDepositerMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: ENetDepositerMemory) {
    const node = new EnergyNode(Game.flags[mem.eNodeFlag]);

    if (node) {
      const tarX = node.flag.pos.x;
      const tarY = node.flag.pos.y;

      if (node.isOccupied()) {
        // Stay back from occupied nodes
        if (!creep.pos.inRangeTo(tarX, tarY, 3)) {
          creep.moveTo(tarX, tarY);
          return true;
        }
      } else {
        // Actually move into Creep nodes
        const range = node.mem.type === 'creep' ? 0 : 1;
        if (!creep.pos.inRangeTo(tarX, tarY, range)) {
          creep.moveTo(tarX, tarY);
          return true;
        }
      }

      // We have arrived

      // Transfer to the node
      if (node.mem.type !== 'creep') {
        // Hack a bit so we remain stationary when the 'creep' at a Creep Node
        node.transferFrom(creep);
        return false;
      }
    }
    return false;
  }

  public static initMemory(node: EnergyNode): ENetDepositerMemory {
    return {
      eNodeFlag: node.flag.name,
    };
  }
}
