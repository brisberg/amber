import {SpawnQueue} from 'spawn-system/spawnQueue';

import {Behavior, getBehaviorMemory} from './behaviors/behavior';
import HarvestBehavior from './behaviors/harvest';
import PickupBehavior from './behaviors/pickup';
import RelieveBehavior from './behaviors/relieve';
import {HarvestMission} from './missions/harvest-mission';
import {PickupMission} from './missions/pickup-mission';

const harvest = new HarvestBehavior();
const relieve = new RelieveBehavior();
const pickup = new PickupBehavior();

const behaviors: {[name: string]: Behavior} = {
  'harvest': harvest,
  'relieve': relieve,
  'pickup': pickup,
};

if (!global.cc) {
  global.cc = {};
  global.cc.spawnMiner = (): void => {
    const spawn = Game.spawns.Spawn1;
    const source = spawn.room.find(FIND_SOURCES)[0];
    spawn.spawnCreep([WORK, CARRY, MOVE], 'miner1', {
      memory: {
        mission: '',
        bodyRatio: '',
        behavior: '',
        mem: behaviors['harvest'].new(source, {}),
      },
    });
  };
}

if (!Memory.missions) {
  Memory.missions = {};
}

export const loop = (): void => {
  // Init the simulation spawn queue
  const spawns = Game.rooms.sim.find(FIND_MY_SPAWNS);
  if (!global.spawnQueues) {
    global.spawnQueues = {};
  }
  if (spawns.length > 0) {
    global.spawnQueues['sim'] = new SpawnQueue('sim', spawns);
  }

  // Init and run drop mining mission
  const miningFlag = Game.flags['mining'];
  if (miningFlag) {
    const msn = new HarvestMission(miningFlag);
    msn.init();
    msn.roleCall();
    msn.run();
  }

  // Init and run drop mining mission
  const pickupFlag = Game.flags['pickup'];
  if (pickupFlag) {
    const msn = new PickupMission(pickupFlag);
    msn.init();
    msn.roleCall();
    msn.run();
  }

  // SpawnQueue must execute after missions have a chance request creeps
  for (const name in global.spawnQueues) {
    if ({}.hasOwnProperty.call(global.spawnQueues, name)) {
      const queue = global.spawnQueues[name];
      queue.run();
    }
  }

  // Run all creep behaviors
  for (const name in Game.creeps) {
    if ({}.hasOwnProperty.call(Game.creeps, name)) {
      const creep = Game.creeps[name];

      if (creep.spawning) {
        continue;
      }

      const mem = getBehaviorMemory(creep);
      if (mem && mem.name) {
        const behavior = behaviors[mem.name];
        if (behavior) {
          behavior.run(creep);
        }
      }
    }
  }
};
