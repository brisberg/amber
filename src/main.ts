import {BuildMission} from 'missions/build';
import {HarvestingMission} from 'missions/harvesting';
import {MiningOperation} from 'missions/miningOperation';
import {Builder} from 'roles/builder';
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
  Memory.missions = Memory.missions || {};
  Memory.spawns = Memory.spawns || {};
  Memory.operations = Memory.operations || {};

  const queue = global.spawnQueue = new SpawnQueue(Game.spawns.Spawn1);
  const op = new MiningOperation(
      'mining_op', Game.spawns.Spawn1.room.find(FIND_SOURCES)[0]);

  installConsoleCommands();
  garbageCollection();

  op.run();
  queue.run();

  for (const name in Memory.missions) {
    if (name.includes('harvest')) {
      const mission = new HarvestingMission(name);
      mission.run();
    } else if (name.includes('build')) {
      const mission = new BuildMission(name);
      mission.run();
    }
  }

  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    if (creep.memory.role === 'miner') {
      const miner = new Miner(creep);
      miner.run();
    }
    if (creep.memory.role === 'harvester') {
      const harvester = new Harvester(creep);
      harvester.run();
    }
    if (creep.memory.role === 'builder') {
      const builder = new Builder(creep);
      builder.run();
    }
  }
};
