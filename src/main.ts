import {RoomEnergyNetwork} from 'energy-network/roomEnergyNetwork';
import {BuildMission} from 'missions/build';
import {HarvestingMission} from 'missions/harvesting';
import {MiningOperation} from 'missions/miningOperation';
import {UpgradeMission} from 'missions/upgrade';
import {Builder} from 'roles/builder';
import {Fetcher} from 'roles/fetcher';
import {Harvester} from 'roles/harvester';
import {Hauler} from 'roles/hauler';
import {Miner} from 'roles/miner';
import {Upgrader} from 'roles/upgrader';
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
  Memory.rooms = Memory.rooms || {};

  const queue = global.spawnQueue = new SpawnQueue(Game.spawns.Spawn1);
  // const op = new MiningOperation(
  //     'mining_op', Game.spawns.Spawn1.room.find(FIND_SOURCES)[0]);

  // const containers =
  //     Game.spawns.Spawn1.room.find(FIND_STRUCTURES)
  //         .filter((struct) => struct.structureType === STRUCTURE_CONTAINER);
  // // WIP hardcoding the upgrade missions
  // if (containers.length > 0 && !Memory.missions.upgrade) {
  //   const upgradeMsn = new UpgradeMission('upgrade');
  //   upgradeMsn.setController(Game.spawns.Spawn1.room.controller!);
  //   upgradeMsn.setSource(containers[0] as StructureContainer);
  // }

  if (Memory.missions.upgrade) {
    const msn = new UpgradeMission('upgrade');
    msn.run();
  }

  installConsoleCommands();
  garbageCollection();

  const roomName = Game.spawns.Spawn1.room.name;
  if (!Memory.rooms[roomName]) {
    Memory.rooms[roomName] = {network: null};
  }

  const eNetwork = new RoomEnergyNetwork(Game.spawns.Spawn1.room);

  // op.run();
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
    if (creep.memory.role === 'upgrader') {
      const upgrader = new Upgrader(creep);
      upgrader.run();
    }
    if (creep.memory.role === 'fetcher') {
      const fetcher = new Fetcher(creep);
      fetcher.run();
    }
    if (creep.memory.role === 'hauler') {
      const hauler = new Hauler(creep);
      hauler.run();
    }
  }
};
