import {SpawnQueue} from 'spawn-system/spawnQueue';

import {getBehaviorMemory} from './behaviors/behavior';
import {setupGlobal} from './global';
import SingleHarvestMsn from './missions/mining/single-harvest';

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

  // Launch mining missions for each source
  const sources = Game.rooms.sim.find(FIND_SOURCES);
  for (let i = 0; i < sources.length; i++) {
    const msnName = `sim-mine-${i}`;
    if (!global.msnRegistry.get(msnName)) {
      console.log(`Launching new Mining Mission: ${msnName}`);
      const msn = new SingleHarvestMsn(msnName).init('sim', {sourceIdx: i});
      global.msnRegistry.register(msn);
    }
  }

  // Execute all of the missions in the Registry
  const missions = global.msnRegistry.list();
  for (const msn of missions) {
    // msn.refresh();
    msn.rollCall();
    msn.run();

    // TODO: Validate the missions.
    // TODO: Retire missions no longer valid.
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
