import {SpawnQueue} from 'spawn-system/spawnQueue';

import {getBehaviorMemory} from './behaviors/behavior';
import {setupGlobal} from './global';
import MiningOperation from './operations/mining/mining.op';

function formatMemory(): void {
  if (!Memory.missions) {
    Memory.missions = {};
  }

  if (!Memory.operations) {
    Memory.operations = {};
  }
}

console.log('-- Global Reset --');
setupGlobal();
formatMemory();

export const loop = (): void => {
  // Init the simulation spawn queue
  const room = 'W1N1';  // Debug for integration testing needs a valid room name
  const spawns = Game.rooms[room].find(FIND_MY_SPAWNS);
  if (!global.spawnQueues) {
    global.spawnQueues = {};
  }
  if (spawns.length > 0) {
    global.spawnQueues[room] = new SpawnQueue(room, spawns);
  }

  // Launch mining operation for each source
  const sources = Game.rooms[room].find(FIND_SOURCES);
  for (let i = 0; i < sources.length; i++) {
    const opName = `${room}-mine-${i}`;
    if (!global.opRegistry.get(opName)) {
      console.log(`Launching new Mining Operation: ${opName}`);
      const op = new MiningOperation(opName).init(room, {
        sourceIdx: i,
        type: 'drop',
      });
      global.opRegistry.register(op);
    }
  }

  // Execute all of the operations in the Registry
  const operations = global.opRegistry.list();
  for (const op of operations) {
    // msn.refresh();
    // msn.rollCall();
    op.refresh();
    op.run();

    // TODO: Validate the missions.
    // TODO: Retire missions no longer valid.
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
