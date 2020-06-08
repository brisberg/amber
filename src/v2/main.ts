import {SpawnQueue} from 'spawn-system/spawnQueue';

import {getBehaviorMemory} from './behaviors/behavior';
import {setupGlobal} from './global';
import {PickupMission} from './missions/logistics/pickup-mission';
import {HarvestMission} from './missions/mining/harvest-mission';

function formatMemory(): void {
  if (!Memory.missions) {
    Memory.missions = {};
  }
}

console.log('Amber AI');
console.log('Initializing...');
console.log(' - Setting up Global');
setupGlobal();
console.log(' - Formatting Memory');
formatMemory();
console.log('...Done');

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
        const behavior = global.behaviorsMap[mem.name];
        if (behavior) {
          behavior.run(creep);
        }
      }
    }
  }
};
