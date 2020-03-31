import {Behavior, BehaviorMemory} from './behavior';
import {DEPOSITER, Depositer, UnitWithStore} from './depositer';
import {FETCHER, Fetcher} from './fetcher';
import {HARVESTER, Harvester} from './harvester';

interface PioneerMemory extends BehaviorMemory {
  controllerID: Id<StructureController>;
  sourceID: Id<Source>;
  state: 'fetching'|'working';
  storeID: Id<StructureContainer|StructureStorage>|null;
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
  protected behaviorActions(creep: Creep, mem: PioneerMemory): boolean {
    const controller = Game.getObjectById(mem.controllerID);
    const source = Game.getObjectById(mem.sourceID);

    if (!controller || !source) {
      return false;
    }

    if (mem.state === 'fetching' && creep.store.getFreeCapacity() === 0) {
      mem.state = 'working';
      mem.storeID = null;
    }

    if (mem.state === 'working' && creep.store.energy === 0) {
      mem.state = 'fetching';
    }

    if (mem.state === 'fetching' && creep.store.getFreeCapacity() > 0) {
      let store;
      if (!mem.storeID) {
        // No target store cached, look for the closest
        const stores = creep.room.find(FIND_STRUCTURES).filter((struct) => {
          // Structure is a non-empty Container or Storage
          return (struct.structureType === STRUCTURE_CONTAINER ||
                  struct.structureType === STRUCTURE_STORAGE) &&
              struct.store.energy > 0;
        }) as Array<StructureStorage|StructureContainer>;

        if (stores.length > 0) {
          let closest = stores[0];
          for (const struct of stores) {
            if (creep.pos.getRangeTo(struct) < creep.pos.getRangeTo(closest)) {
              closest = struct;
            }
          }
          store = closest;
          mem.storeID = store.id;
        }
      } else {
        // Reuse cached store
        store = Game.getObjectById(mem.storeID);
        if (!store || store.store.energy === 0) {
          // Store was removed or is out of energy, moving on
          store = undefined;
          mem.storeID = null;
        }
      }

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
      for (const spawn of spawns) {
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
      controllerID: controller.id,
      sourceID: source.id,
      state: 'fetching',
      storeID: null,
    };
  }
}
