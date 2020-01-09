// import {EmergencyMining} from 'missions/emergencyMining';
import {HarvestingMission} from 'missions/harvesting';
import {Harvester} from 'roles/harvester';
import {Miner} from 'roles/miner';
import {SpawnQueue} from 'spawnQueue';

import {installConsoleCommands} from './consoleCommands';
import {garbageCollection} from './garbageCollect';

// When compiling TS to JS and bundling with rollup, the line numbers and file
// names in error messages change This utility uses source maps to get the line
// numbers and file names of the original, TS source code
// export const loop = ErrorMapper.wrapLoop(() => {
export const loop = () => {
  // Initialize global constructs
  if (!Memory.missions) {
    Memory.missions = {};
  }
  const queue = global.spawnQueue = new SpawnQueue(Game.spawns.Spawn1);
  const mission = new HarvestingMission(
      'harvest', Game.spawns.Spawn1.room.find(FIND_SOURCES)[0]);

  installConsoleCommands();
  garbageCollection();

  mission.run();
  queue.run();

  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    if (creep.memory.role === 'miner') {
      const miner = new Miner(creep);
      miner.run();
    }
    if (creep.memory.role === 'harvester') {
      const miner = new Harvester(creep);
      miner.run();
    }
  }
};
