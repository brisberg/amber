import {Behavior, BehaviorMemory} from './behavior';
import {Depositer, DEPOSITER} from './depositer';
import {Harvester, HARVESTER} from './harvester';

interface EmergencyMinerMemory extends BehaviorMemory {
  sourceID: Id<Source>;
  spawnID: Id<StructureSpawn>;
}

export const EMERGENCY_MINER = 'emg-miner';

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
  protected behaviorActions(creep: Creep, mem: EmergencyMinerMemory): boolean {
    const source = Game.getObjectById(mem.sourceID);
    const spawn = Game.getObjectById(mem.spawnID);

    if (source && spawn) {
      // Harvest more energy
      if (mem.subBehavior !== HARVESTER && creep.store.energy === 0) {
        mem.subBehavior = HARVESTER;
        mem.mem = Harvester.initMemory(source);
        return false;
      } else if (
          mem.subBehavior !== DEPOSITER &&
          creep.store.getFreeCapacity() === 0) {
        // Deposit energy in spawn
        mem.subBehavior = DEPOSITER;
        mem.mem = Depositer.initMemory(spawn);
        return false;
      }
    }

    return false;
  }

  public static initMemory(spawn: StructureSpawn, source: Source):
      EmergencyMinerMemory {
    return {
      sourceID: source.id,
      spawnID: spawn.id,
    };
  }
}
