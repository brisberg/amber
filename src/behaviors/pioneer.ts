import {Behavior, BehaviorMemory} from './behavior';
import {BUILDER, Builder} from './builder';
import {DEPOSITER, Depositer} from './depositer';
import {HARVESTER, Harvester} from './harvester';
import {Upgrader, UPGRADER} from './upgrader';

interface PioneerMemory extends BehaviorMemory {
  controllerId: Id<StructureController>;
  sourceId: Id<Source>;
  state: 'fetching'|'working';
}

export const PIONEER = 'pioneer';

/**
 * Versatile Creep behavior class for Pioneer creeps.
 *
 * These creeps will perform a wide range of tasks to get a colony going:
 *
 * Harvest energy from source if they don't have any.
 * Deliver to Spawn or Extensions if it is not full.
 * Will construct any construction sites (extensions first)
 * Upgrade Controller if everything is full.
 *
 * This can get a colony off the ground, but pioneers are not particularly
 * efficient compared to specialized creeps. This missions should be abandoned.
 * at RCL3.
 *
 * Tied to the spawn system, creeps with no active missions will be assigned
 * this behavior.
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
      mem.subBehavior = HARVESTER;
      mem.mem = Harvester.initMemory(source);
      return false;
    }

    if (mem.state === 'working') {
      // Fill the spawn first
      const spawns = creep.room.find(FIND_MY_SPAWNS);
      if (spawns.length > 0) {
        const spawn = spawns[0];
        if (spawn.store.getFreeCapacity() > 0) {
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
        if (extend.store.getFreeCapacity() > 0) {
          mem.subBehavior = DEPOSITER;
          mem.mem = Depositer.initMemory(extend);
          return false;
        }
      }

      // Build Construction Sites
      const sites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
      // Extensions first
      const extendSites =
          sites.filter((site) => site.structureType === STRUCTURE_EXTENSION);
      if (extendSites.length > 0) {
        mem.subBehavior = BUILDER;
        mem.mem = Builder.initMemory(extendSites[0]);
        return false;
      }
      // Then the rest
      if (sites.length > 0) {
        mem.subBehavior = BUILDER;
        mem.mem = Builder.initMemory(sites[0]);
        return false;
      }

      // Upgrade the Controller with what is left
      mem.subBehavior = UPGRADER;
      mem.mem = Upgrader.initMemory(controller);
      return false;
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
