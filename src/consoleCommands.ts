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
    return Game.spawns[spawn].spawnCreep(
        createWorkerBody(1, 2, 2), `miner=${id}`, {
          memory: {
            role: 'miner',
            sourceId: Game.spawns[spawn].room.find(FIND_SOURCES)[0].id,
          },
        });
  },
};
