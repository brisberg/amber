import {Behavior, BehaviorMemory} from './behavior';
import {DEPOSITER, Depositer, UnitWithStore} from './depositer';
import {FETCHER, Fetcher} from './fetcher';
import {HARVESTER, Harvester} from './harvester';

interface PioneerMemory extends BehaviorMemory {
  controllerId: Id<StructureController>;
  sourceId: Id<Source>;
  state: 'fetching'|'working';
}

export const PIONEER = 'pioneer';

/**
 * Versatile Creep behavior class for Pioneer creeps. (Maybe rename to
 * EmergencyMiner?)
 *
 * These creeps will perform a wide range of tasks to get a colony going:
 *
 * Harvest energy from source if they don't have any.
 * Deliver to Spawn or Extensions if they are not full.
 *
 * This creep can get a new colony started, or restart an existing colony that
 * has suffered a catastrophic failure. However, these creeps are not as
 * efficient as specialized creeps and the mission should be abandoned as soon
 * as the colony is healthy.
 */
export class Pioneer extends Behavior<PioneerMemory> {
  /* @override */
  protected behaviorActions(creep: Creep, mem: PioneerMemory) {
    const controller = Game.getObjectById(mem.controllerId);
    const source = Game.getObjectById(mem.sourceId);

    if (!controller || !source) {
      return false;
    }

    if (mem.state === 'fetching' && creep.store.getFreeCapacity() === 0) {
      mem.state = 'working';
    }

    if (mem.state === 'working' && creep.store.energy === 0) {
      mem.state = 'fetching';
    }

    if (mem.state === 'fetching' && creep.store.getFreeCapacity() > 0) {
      const stores = creep.room.find(FIND_STRUCTURES).filter((struct) => {
        return struct.structureType === STRUCTURE_CONTAINER ||
            struct.structureType === STRUCTURE_STORAGE;
      }) as Array<StructureStorage|StructureContainer>;

      const store = stores.find((s) => s.store.energy > 0);

      if (store) {
        mem.subBehavior = FETCHER;
        mem.mem = Fetcher.initMemory(store as UnitWithStore);
      } else {
        mem.subBehavior = HARVESTER;
        mem.mem = Harvester.initMemory(source);
        return false;
      }
    }

    if (mem.state === 'working') {
      // Fill the spawn first
      const spawns = creep.room.find(FIND_MY_SPAWNS);
      if (spawns.length > 0) {
        const spawn = spawns[0];
        if (spawn.energy < spawn.energyCapacity) {
          mem.subBehavior = DEPOSITER;
          mem.mem = Depositer.initMemory(spawn);
          return false;
        }
      }

      // Fill the extensions next
      const extensions = creep.room.find(FIND_MY_STRUCTURES, {
        filter: {structureType: STRUCTURE_EXTENSION},
      }) as StructureExtension[];
      for (const extend of extensions) {
        if (extend.energy < extend.energyCapacity) {
          mem.subBehavior = DEPOSITER;
          mem.mem = Depositer.initMemory(extend);
          return false;
        }
      }
    }

    return false;
  }

  public static initMemory(controller: StructureController, source: Source):
      PioneerMemory {
    return {
      controllerId: controller.id,
      sourceId: source.id,
      state: 'fetching',
    };
  }
}
