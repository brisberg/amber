import 'behaviors';  // Required to initialize BehaviorMap
import 'missions';   // Required to initialize MissionsMap
import 'operations'; // Required to initialize OperationsMap

import {IDLER} from 'behaviors/idler';
import {registerEnergyNode} from 'energy-network/energyNode';
import {RoomEnergyNetwork} from 'energy-network/roomEnergyNetwork';
// tslint:disable-next-line: max-line-length
import {BASE_OPERATION_FLAG, BUILD_OPERATION_FLAG, CORE_ENERGY_NODE_FLAG, flagIsColor, MINING_OPERATION_FLAG, PIONEER_MISSION_FLAG, UPGRADE_OPERATION_FLAG} from 'flagConstants';
import {Mission} from 'missions/mission';
import {PioneerMission} from 'missions/pioneer';
import {AllOperations} from 'operations';
import {BaseOperation} from 'operations/BaseOperation';
import {MiningOperation} from 'operations/miningOperation';
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
  Memory.flags = Memory.flags || {};

  const roomName = Game.spawns.Spawn1.room.name;
  if (!Memory.rooms[roomName]) {
    Memory.rooms[roomName] = {network: null};
  }

  const queue = global.spawnQueue = new SpawnQueue(Game.spawns.Spawn1);

  installConsoleCommands();
  garbageCollection();

  let roomHealthy = true;

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
      // Aggregate health check on the base
      if (op instanceof MiningOperation || op instanceof BaseOperation) {
        console.log(op.name + ' is Healthy: ' + op.isHealthy());
        roomHealthy = op.isHealthy() && roomHealthy;
        console.log('room Healthy: ' + roomHealthy);
      }
      continue;
    }

    if (flagIsColor(flag, CORE_ENERGY_NODE_FLAG)) {
      const eNetwork = new RoomEnergyNetwork(flag);

      if (eNetwork.init()) {
        eNetwork.run();
        // Aggregate health check on the base
        console.log('eNetwork is Healthy: ' + eNetwork.isHealthy());
        roomHealthy = eNetwork.isHealthy() && roomHealthy;
        console.log('room Healthy: ' + roomHealthy);
      } else {
        eNetwork.retire();
      }
    }
  }

  // Hack, check for existance of network
  if (Game.spawns.Spawn1.room.find(FIND_FLAGS, {filter: CORE_ENERGY_NODE_FLAG})
          .length === 0) {
    roomHealthy = false;
  }

  function executeMission(mission: Mission<any>) {
    if (mission.init()) {
      mission.roleCall();
      mission.run();
    } else {
      mission.retire();
    }
  }

  function executeOperation(operation: AllOperations) {
    if (operation.init()) {
      operation.run();
    } else {
      operation.retire();
    }
  }

  // HACK for now, Pioneer Mission if the colony is not healthy
  const spawn = Game.spawns.Spawn1;
  const room = spawn.room;
  const controller = room.controller;
  const sources = room.find(FIND_SOURCES);
  // Launch Pioneer Mission if room isn't healthy
  console.log('Final: roomHealthy: ' + roomHealthy);
  if (!roomHealthy) {
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
      msn.setController(controller!);
      msn.setSources(sources);
    }
  } else {
    console.log('room healthy, looking for existing pioneer flag')
    const existingFlag =
        spawn.pos.lookFor(LOOK_FLAGS)
            .filter((flag) => flagIsColor(flag, PIONEER_MISSION_FLAG));
    if (existingFlag.length > 0) {
      console.log('retiring existing pioneer mission');
      const msn = new PioneerMission(existingFlag[0]);
      msn.retire();
    }
  }

  // HACK for now, Spawn a Mining operation for each source
  for (const source of sources) {
    source.pos.createFlag(
        'mining-' + source.id, MINING_OPERATION_FLAG.color,
        MINING_OPERATION_FLAG.secondaryColor);
  }

  // Hack for now
  const corePos = spawn.room.getPositionAt(spawn.pos.x + 2, spawn.pos.y);
  if (corePos) {
    // Look for Container/Storage
    const structs = corePos.lookFor(LOOK_STRUCTURES);
    if (structs.length === 0) {
      // Look for Construction Site
      const coreSites = corePos.lookFor(LOOK_CONSTRUCTION_SITES);
      if (coreSites.length === 0 ||
          coreSites[0].structureType !== STRUCTURE_CONTAINER) {
        // Create Construction Site
        corePos.createConstructionSite(STRUCTURE_CONTAINER);
      }
    } else if (
        structs[0].structureType === STRUCTURE_CONTAINER ||
        structs[0].structureType === STRUCTURE_STORAGE) {
      // Core Store is build, initialize the ENetwork
      const existingFlag =
          corePos.lookFor(LOOK_FLAGS)
              .filter((flag) => flagIsColor(flag, CORE_ENERGY_NODE_FLAG));
      if (existingFlag.length === 0) {
        // Initialize the network
        const flagName = 'network_core_node';
        registerEnergyNode(spawn.room, [corePos.x, corePos.y], {
          color: CORE_ENERGY_NODE_FLAG,
          persistant: true,
          polarity: 0,
          type: 'structure',
        });
      }
    }
  }

  // HACK for now
  const sites = room.find(
      FIND_CONSTRUCTION_SITES, {filter: {structureType: STRUCTURE_CONTAINER}});
  if (sites.length !== 0) {
    for (let i = 0; i < 2; i++) {  // run 2 concurrent build ops
      const site = sites.shift();
      if (site !== undefined) {
        const opName = 'build-' + site.id;
        if (!Game.flags[opName]) {
          site.pos.createFlag(
              opName, BUILD_OPERATION_FLAG.color,
              BUILD_OPERATION_FLAG.secondaryColor);
        }
      }
    }
  }

  // HACK for now
  const eNodes = room.find(FIND_FLAGS, {filter: CORE_ENERGY_NODE_FLAG});
  if (eNodes.length > 0) {
    // Initialize the Upgrade Operation once the Energy Network is online
    if (controller) {
      if (!Game.flags.upgrade_op) {
        controller.pos.createFlag(
            'upgrade_op', UPGRADE_OPERATION_FLAG.color,
            UPGRADE_OPERATION_FLAG.secondaryColor);
      }
    }

    // Initialize the Base Operation once the Energy Network is online
    if (!Game.flags.base_op) {
      spawn.pos.createFlag(
          'base_op', BASE_OPERATION_FLAG.color,
          BASE_OPERATION_FLAG.secondaryColor);
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
