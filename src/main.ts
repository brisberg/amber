import 'behaviors'; // Required to initialize BehaviorMap
import {RoomEnergyNetwork} from 'energy-network/roomEnergyNetwork';
import {BuildMission} from 'missions/build';
import {HarvestingMission} from 'missions/harvesting';
import {MiningOperation} from 'missions/miningOperation';
// import {UpgradeMission} from 'missions/upgrade';
import {UpgradeOperation} from 'missions/upgradeOperation';
import {SpawnQueue} from 'spawn-system/spawnQueue';

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
  Memory.rooms = Memory.rooms || {};

  const roomName = Game.spawns.Spawn1.room.name;
  if (!Memory.rooms[roomName]) {
    Memory.rooms[roomName] = {network: null};
  }
  const eNetwork = global.eNetwork =
      new RoomEnergyNetwork(Game.spawns.Spawn1.room);

  const queue = global.spawnQueue = new SpawnQueue(Game.spawns.Spawn1);
  const mOp = new MiningOperation(
      'mining_op', Game.spawns.Spawn1.room.find(FIND_SOURCES)[0]);
  if (eNetwork.hasSource()) {
    const uOp =
        new UpgradeOperation('upgrade_op', Game.spawns.Spawn1.room.controller!);
    uOp.run();
  }

  installConsoleCommands();
  garbageCollection();

  mOp.run();
  eNetwork.run();
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

    if (creep.spawning) {
      continue;
    }

    // Execute all creep behaviors
    global.behaviors[creep.memory.behavior].run(creep, creep.memory.mem);
  }
};
