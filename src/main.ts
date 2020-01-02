import {Miner} from 'roles/miner';
import {SpawnQueue} from 'spawnQueue';
import {ErrorMapper} from 'utils/ErrorMapper';

import {installConsoleCommands} from './consoleCommands';
import {garbageCollection} from './garbageCollect';

// When compiling TS to JS and bundling with rollup, the line numbers and file
// names in error messages change This utility uses source maps to get the line
// numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  const spawnQueue = new SpawnQueue(Game.spawns.Spawn1);

  installConsoleCommands(spawnQueue);
  garbageCollection();

  spawnQueue.run();

  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    if (creep.memory.role === 'miner') {
      const miner = new Miner(creep);
      miner.run();
    }
  }
});
