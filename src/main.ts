import 'behaviors';  // Required to initialize BehaviorMap
import 'missions';   // Required to initialize MissionsMap
import 'operations'; // Required to initialize OperationsMap

import {IDLER} from 'behaviors/idler';
import {RoomEnergyNetwork} from 'energy-network/roomEnergyNetwork';
// tslint:disable-next-line: max-line-length
import {BUILD_OPERATION_FLAG, CORE_ENERGY_NODE_FLAG, ENERGY_NODE_FLAG, flagIsColor, PIONEER_MISSION_FLAG, UPGRADE_OPERATION_FLAG} from 'flagConstants';
import {Mission} from 'missions/mission';
import {PioneerMission} from 'missions/pioneer';
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

  installConsoleCommands();
  garbageCollection();

  // Execute all Missions and Operations based on flags
  for (const name in Game.flags) {
    const flag = Game.flags[name];

    const msn = global.missions(flag);
    if (msn) {
      executeMission(msn);
      continue;
    }

    const op = global.operations(flag);
    if (op) {
      executeOperation(op);
      continue;
    }

    if (flagIsColor(flag, CORE_ENERGY_NODE_FLAG)) {
      const eNetwork = new RoomEnergyNetwork(flag);
      if (eNetwork.init()) {
        eNetwork.run();
      } else {
        eNetwork.retire();
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

  function executeOperation(operation: BuildOperation|UpgradeOperation) {
    if (operation.init()) {
      operation.run();
    } else {
      operation.retire();
    }
  }

  // HACK for now
  const spawn = Game.spawns.Spawn1;
  const room = spawn.room;
  const controller = room.controller;
  const sources = room.find(FIND_SOURCES);
  if (controller && controller.level < 3) {
    const existingFlag =
        spawn.pos.lookFor(LOOK_FLAGS)
            .filter((flag) => flagIsColor(flag, PIONEER_MISSION_FLAG));
    if (existingFlag.length === 0) {
      // Launch the Pioneer Mission
      const flagName = spawn.name + '_pioneer';
      spawn.pos.createFlag(
          flagName, PIONEER_MISSION_FLAG.color,
          PIONEER_MISSION_FLAG.secondaryColor);
      const flag = Game.flags[flagName];
      const msn = new PioneerMission(flag);
      msn.setController(controller);
      msn.setSources(sources);
    }
  }

  // HACK for now
  for (const source of sources) {
    const mOp = new MiningOperation('mining-' + source.id, source);
    mOp.run();
  }

  // HACK for now
  const sites = room.find(
      FIND_CONSTRUCTION_SITES, {filter: {structureType: STRUCTURE_CONTAINER}});
  if (sites.length !== 0) {
    const site = sites[0];
    if (!Game.flags.build_op) {
      site.pos.createFlag(
          'build_op', BUILD_OPERATION_FLAG.color,
          BUILD_OPERATION_FLAG.secondaryColor);
    }
  }

  // HACK for now
  const eNodes = room.find(FIND_FLAGS, {filter: ENERGY_NODE_FLAG});
  if (controller && eNodes.length >= 2) {
    if (!Game.flags.upgrade_op) {
      controller.pos.createFlag(
          'upgrade_op', UPGRADE_OPERATION_FLAG.color,
          UPGRADE_OPERATION_FLAG.secondaryColor);
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
