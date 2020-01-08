import {createWorkerBody} from 'utils/workerUtils';

/**
 * Installs all Console Commands to the global scope. Can be accessed by:
 * `cc.command()`
 */
export function installConsoleCommands() {
  global.cc = CONSOLE_COMMANDS;
}

const CONSOLE_COMMANDS = {
  spawnMiner: () => {
    const spawn = 'Spawn1';
    const id = Memory.nextID || 0;
    Memory.nextID = id + 1;
    global.spawnQueue.requestCreep({
      body: createWorkerBody(1, 2, 2),
      name: `miner=${id}`,
      options: {
        memory: {
          containerID: null,
          role: 'miner',
          sourceID: Game.spawns[spawn].room.find(FIND_SOURCES)[0].id,
        },
      },
      priority: 0,
    });
    return;
  },
};
