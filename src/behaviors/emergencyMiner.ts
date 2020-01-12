import {Behavior, BehaviorMemory} from './behavior';
import {Depositer, DEPOSITER_KEY} from './depositer';
import {Harvester, HARVESTER_KEY} from './harvester';

interface EmergencyMinerMemory extends BehaviorMemory {
  sourceID: Id<Source>;
  spawnID: Id<StructureSpawn>;
}

export const EMERGENCY_MINER_KEY = 'emg-miner';

/**
 * Creep behavior class for a single creep to harvest from a single Energy
 * Source and fuel a Spawn.
 *
 * Takes a creep. Handles moving the creep towards the Source,
 * harvesting it, transporting the Energy back to Spawn.
 *
 * This role is mainly used to recovery from an emergency, or to bootstrap a new
 * colony/outpost.
 */
export class EmergencyMiner extends Behavior<EmergencyMinerMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: EmergencyMinerMemory) {
    const source = Game.getObjectById(mem.sourceID);
    const spawn = Game.getObjectById(mem.spawnID);

    if (source && spawn) {
      // Harvest more energy
      if (mem.subBehavior !== HARVESTER_KEY && creep.store.energy === 0) {
        mem.subBehavior = HARVESTER_KEY;
        mem.mem = Harvester.initMemory(source);
        return false;
      } else if (
          mem.subBehavior !== DEPOSITER_KEY &&
          creep.store.getFreeCapacity() === 0) {
        // Deposit energy in spawn
        mem.subBehavior = DEPOSITER_KEY;
        mem.mem = Depositer.initMemory(spawn);
        return false;
      }
    }

    return false;
  }
}
