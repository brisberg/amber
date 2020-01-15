import 'behaviors'; // Required to initialize BehaviorMap

import {IDLER} from 'behaviors/idler';
import {RoomEnergyNetwork} from 'energy-network/roomEnergyNetwork';
import {BUILD_TARGET_FLAG_COLOR, UPGRADE_OPERATION_FLAG_COLOR} from 'flagConstants';
import {BuildMission} from 'missions/build';
import {HarvestingMission} from 'missions/harvesting';
import {Mission} from 'missions/mission';
import {TransportMission} from 'missions/transport';
import {UpgradeMission} from 'missions/upgrade';
import {BuildOperation} from 'operations/buildOperation';
import {MiningOperation} from 'operations/miningOperation';
import {UpgradeOperation} from 'operations/upgradeOperation';
import {declareOrphan} from 'spawn-system/orphans';
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
  Memory.operations = Memory.operations || {};
  Memory.rooms = Memory.rooms || {};

  const roomName = Game.spawns.Spawn1.room.name;
  if (!Memory.rooms[roomName]) {
    Memory.rooms[roomName] = {network: null};
  }

  const queue = global.spawnQueue = new SpawnQueue(Game.spawns.Spawn1);
  const eNetwork = global.eNetwork =
      new RoomEnergyNetwork(Game.spawns.Spawn1.room);
  eNetwork.initNetwork();

  const sources = Game.spawns.Spawn1.room.find(FIND_SOURCES);
  for (const source of sources) {
    const mOp = new MiningOperation('mining-' + source.id, source);
    mOp.run();
  }

  installConsoleCommands();
  garbageCollection();

  eNetwork.run();

  // Hack for now
  for (const name in Game.flags) {
    const flag = Game.flags[name];
    if (flag.color === BUILD_TARGET_FLAG_COLOR) {
      const op = new BuildOperation(flag);
      if (op.init()) {
        op.run();
      } else {
        op.retire();
      }
    }
    if (flag.color === UPGRADE_OPERATION_FLAG_COLOR) {
      const op = new UpgradeOperation(flag);
      if (op.init()) {
        op.run();
      } else {
        op.retire();
      }
    }
  }

  function executeMission(mission: Mission<any>) {
    if (mission.init()) {
      mission.roleCall();
      mission.run();
    } else {
      mission.retire();
    }
  }

  for (const name in Memory.missions) {
    // TODO: Need to fix this to better handle dispatching missions
    if (name.includes('supply')) {
      const flag = Game.flags.build_op_supply;
      const mission = new TransportMission(flag);
      executeMission(mission);
    } else if (name === 'upgrade_op_upgrade') {
      const flag = Game.flags.upgrade_op_upgrade;
      const mission = new UpgradeMission(flag);
      executeMission(mission);
    } else if (name.includes('harvest')) {
      const flag = Game.flags[name];
      const mission = new HarvestingMission(flag);
      executeMission(mission);
    } else if (name.includes('build')) {
      const flag = Game.flags[name];
      const mission = new BuildMission(flag);
      executeMission(mission);
    }
  }

  // HACK for now
  const room = Game.spawns.Spawn1.room;
  const sites = room.find(
      FIND_CONSTRUCTION_SITES, {filter: {structureType: STRUCTURE_CONTAINER}});
  if (sites.length !== 0) {
    const site = sites[0];
    if (!Game.flags.build_op) {
      site.pos.createFlag('build_op', BUILD_TARGET_FLAG_COLOR);
    }
  }

  // HACK for now
  const controller = room.controller;
  if (controller && eNetwork.nodes.length >= 3) {
    if (!Game.flags.upgrade_op) {
      controller.pos.createFlag('upgrade_op', UPGRADE_OPERATION_FLAG_COLOR);
    }
  }

  // SpawnQueue must execute after missions have a chance request creeps
  queue.run();

  for (const name in Game.creeps) {
    const creep = Game.creeps[name];

    if (creep.spawning) {
      continue;
    }

    if (!creep.memory.mission || !Memory.missions[creep.memory.mission]) {
      // Creep is Orphaned, or its mission was cancelled
      if (creep.memory.behavior !== IDLER) {
        declareOrphan(creep);
      }
    }

    // Execute all creep behaviors
    global.behaviors[creep.memory.behavior].run(creep, creep.memory.mem);
  }
};
