import {SpawnQueue} from 'spawnQueue';
import {createWorkerBody} from 'utils/workerUtils';

/**
 * Installs all Console Commands to the global scope. Can be accessed by:
 * `cc.command()`
 */
export function installConsoleCommands(spawnQueue: SpawnQueue) {
  global.cc = CONSOLE_COMMANDS(spawnQueue);
}

const CONSOLE_COMMANDS = (spawnQueue: SpawnQueue) => {
  return {
    spawnMiner: () => {
      const spawn = 'Spawn1';
      const id = Memory.nextID || 0;
      Memory.nextID = id + 1;
      spawnQueue.requestCreep({
        body: createWorkerBody(1, 2, 2),
        name: `miner=${id}`,
        options: {
          memory: {
            role: 'miner',
            sourceId: Game.spawns[spawn].room.find(FIND_SOURCES)[0].id,
          },
        },
        priority: 0,
      });
      return;
    },
  };
};
