/* eslint-disable @typescript-eslint/no-non-null-assertion */
import 'behaviors';    // Required to initialize BehaviorMap
import 'missions';     // Required to initialize MissionsMap
import 'operations';   // Required to initialize OperationsMap
import 'towers/tower'; // Required to initialize Tower Behavior

import {IDLER} from 'behaviors/idler';
import {registerEnergyNode} from 'energy-network/energyNode';
import {operateLinks} from 'energy-network/linkConnection';
import {RoomEnergyNetwork} from 'energy-network/roomEnergyNetwork';
import {
  BASE_OPERATION_FLAG,
  BUILD_OPERATION_FLAG,
  CORE_ENERGY_NODE_FLAG,
  ENERGY_NODE_FLAG,
  EXTENSION_GROUP_A_FLAG,
  EXTENSION_GROUP_B_FLAG,
  flagIsColor,
  MINING_OPERATION_FLAG,
  PIONEER_MISSION_FLAG,
  TOWN_SQUARE_FLAG,
  UPGRADE_OPERATION_FLAG,
} from 'flagConstants';
import {ExtensionGroup} from 'layout/extensionGroup';
import {TownSquare} from 'layout/townSquare';
import {PioneerMission} from 'missions/colonization/pioneer';
import {Mission} from 'missions/mission';
import {AllOperations} from 'operations';
import {BaseOperation} from 'operations/baseOperation';
import {MiningOperation} from 'operations/miningOperation';
import {declareOrphan} from 'spawn-system/orphans';
import {SpawnQueue} from 'spawn-system/spawnQueue';

import {installConsoleCommands} from './consoleCommands';
import garbageCollection from './garbageCollect';

// When compiling TS to JS and bundling with rollup, the line numbers and file
// names in error messages change This utility uses source maps to get the line
// numbers and file names of the original, TS source code
// export const loop = ErrorMapper.wrapLoop(() => {
export const loop = (): void => {
  // Pause Script Execution
  if (Memory.pauseUtil && Game.time < Memory.pauseUtil) {
    return;
  }

  // Initialize global constructs
  Memory.missions = Memory.missions || {};
  Memory.operations = Memory.operations || {};
  Memory.rooms = Memory.rooms || {};
  Memory.flags = Memory.flags || {};
  // Debug for now, to allow integration tests to pass
  Memory.auto = Memory.auto || {
    sourceBuild: true,
    mining: true,
    upgrade: true,
    enetwork: true,
  };
  global.spawnQueues = global.spawnQueues || {};

  installConsoleCommands();
  garbageCollection();

  // Loop over all rooms
  for (const roomName in Game.rooms) {
    if ({}.hasOwnProperty.call(Game.rooms, roomName)) {
      const room = Game.rooms[roomName];

      if (!room.controller || !room.controller.my) {
        // Skip rooms we don't own
        continue;
      }

      if (!Memory.rooms[roomName]) {
        Memory.rooms[roomName] = {network: null, damaged: []};
      }

      // TODO: Pass all spawns to the Spawn Queue
      const spawns = room.find(FIND_MY_SPAWNS);
      if (spawns.length > 0) {
        global.spawnQueues[roomName] = new SpawnQueue(room.name, spawns);
      }

      // Run Tower Code
      // TODO: Refactor this into a Defense Mission/Operation based on a flag
      const towers = Game.rooms[roomName].find(FIND_MY_STRUCTURES, {
        filter: {
          structureType: STRUCTURE_TOWER,
        },
      }) as StructureTower[];
      for (const tower of towers) {
        global.tower.run(tower);
      }
    }
  }


  /**
   * Initialize a mission and run it if successful, otherwise retire the
   * mission as it has been corrupted
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function executeMission(mission: Mission<any>): void {
    if (mission.init()) {
      mission.roleCall();
      mission.run();
    } else {
      mission.retire();
    }
  }
  /**
   * Initialize a Operation and run it if successful, otherwise retire the
   * operation as it has been corrupted
   */
  function executeOperation(operation: AllOperations): void {
    if (operation.init()) {
      operation.run();
    } else {
      operation.retire();
    }
  }

  // Aggregate status of Room Health checks
  let roomHealthy = true;

  // Execute all Missions and Operations based on flags
  for (const name in Game.flags) {
    if ({}.hasOwnProperty.call(Game.flags, name)) {
      const flag = Game.flags[name];

      // Execute Mission if this is a Mission Flag
      const msn = global.missions(flag);
      if (msn) {
        executeMission(msn);
        continue;
      }

      // Execute Operation if this is a Operation Flag
      const op = global.operations(flag);
      if (op) {
        executeOperation(op);
        // Aggregate health check on the base
        if (op instanceof MiningOperation || op instanceof BaseOperation) {
          roomHealthy = op.isHealthy() && roomHealthy;
        }
        continue;
      }

      // Execute Energy Network if this is a Core Energy Node Flag
      if (flagIsColor(flag, CORE_ENERGY_NODE_FLAG)) {
        const eNetwork = new RoomEnergyNetwork(flag);

        if (eNetwork.init()) {
          eNetwork.run();
          // Aggregate health check on the base
          roomHealthy = eNetwork.isHealthy() && roomHealthy;
        } else {
          eNetwork.retire();
        }
      }

      // Execute Town Square
      if (flagIsColor(flag, TOWN_SQUARE_FLAG)) {
        const square = new TownSquare(flag);
        if (square.init()) {
          if (Game.time % 100 === 0) {
            square.replaceMissingStructures();
          }
          // const layout = new BaseLayoutController(flag);
          // layout.layoutFlags();
        } else {
          square.retire();
        }
      }

      // Execute Extension Groups
      if (flagIsColor(flag, EXTENSION_GROUP_A_FLAG) ||
          flagIsColor(flag, EXTENSION_GROUP_B_FLAG)) {
        const extend = new ExtensionGroup(flag);
        if (extend.init()) {
          if (Game.time % 100 === 0) {
            extend.replaceMissingExtension();
          }
        } else {
          extend.retire();
        }
      }
    }
  }

  // Loop over all rooms and execute auto actions
  for (const roomName in Game.rooms) {
    if ({}.hasOwnProperty.call(Game.rooms, roomName)) {
      const room = Game.rooms[roomName];

      if (!room.controller || !room.controller.my) {
        // Skip rooms we don't own
        continue;
      }

      // Hack, check for existance of network
      if (room.find(FIND_FLAGS, {filter: CORE_ENERGY_NODE_FLAG}).length === 0) {
        roomHealthy = false;
      }

      // Hack, check for links and push energy to controller if so
      if (room.controller.level >= 5) {
        operateLinks(room);
      }

      // If we are in autoMode, automatically place oprations/layout flags
      if (Memory.auto !== undefined) {
        const spawn = room.find(FIND_MY_SPAWNS)[0];
        const controller = room.controller;
        const sources = room.find(FIND_SOURCES);

        // HACK for now, Pioneer Mission if the colony is not healthy
        // Launch Pioneer Mission if room isn't healthy
        if (Memory.auto.pioneer === true && spawn) {
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
            const existingFlag =
                spawn.pos.lookFor(LOOK_FLAGS)
                    .filter((flag) => flagIsColor(flag, PIONEER_MISSION_FLAG));
            if (existingFlag.length > 0) {
              console.log('Room Healthy: Retiring Pioneer Mission');
              const msn = new PioneerMission(existingFlag[0]);
              msn.retire();
            }
          }
        }

        if (Memory.auto.mining === true) {
          // HACK for now, Spawn a Mining operation for each source
          for (const source of sources) {
            source.pos.createFlag(
                'mining-' + source.id, MINING_OPERATION_FLAG.color,
                MINING_OPERATION_FLAG.secondaryColor);
          }
        }

        if (Memory.auto.enetwork && spawn) {
          // Hack for now, initialize Core ENetwork at storage or temp container
          const storage = room.storage;
          const corePos =
              spawn.room.getPositionAt(spawn.pos.x + 2, spawn.pos.y);
          if (storage) {  // We have storage, use it as the network core
            const existingFlag =
                room.find(FIND_FLAGS, {filter: CORE_ENERGY_NODE_FLAG});
            if (existingFlag.length === 0) {
              // Initialize the network
              // const flagName = 'network_core_node';
              registerEnergyNode(spawn.room, [storage.pos.x, storage.pos.y], {
                color: CORE_ENERGY_NODE_FLAG,
                coreBuffer: 0,
                persistant: true,
                polarity: 0,
                type: 'structure',
              });
            } else {
              const flag = existingFlag[0];
              if (!flag.pos.isEqualTo(storage.pos)) {
                // Remove old container, if it exists
                const structs =
                    flag.pos.lookFor(LOOK_STRUCTURES).filter((struct) => {
                      return struct.structureType === STRUCTURE_CONTAINER;
                    });
                for (const cont of structs) {
                  cont.destroy();
                }
                flag.remove();
              }
            }
          } else if (corePos) {  // No storage, look for temp container
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
                      .filter(
                          (flag) => flagIsColor(flag, CORE_ENERGY_NODE_FLAG));
              if (existingFlag.length === 0) {
                // Initialize the network
                // const flagName = 'network_core_node';
                registerEnergyNode(spawn.room, [corePos.x, corePos.y], {
                  color: CORE_ENERGY_NODE_FLAG,
                  coreBuffer: 0,
                  persistant: true,
                  polarity: 0,
                  type: 'structure',
                });
              }
            }
          }
        }

        if (Memory.auto.sourceBuild === true && spawn) {
          // HACK for now, initialze Source Builder Operations
          const conts = room.find(
              FIND_CONSTRUCTION_SITES,
              {filter: {structureType: STRUCTURE_CONTAINER}});
          if (conts.length !== 0) {
            for (const site of conts) {
              // Always run Source Builder Operations
              if (site.pos.findInRange(FIND_SOURCES, 1).length > 0) {
                const opName = 'build-' + site.id;
                if (!Game.flags[opName]) {
                  site.pos.createFlag(
                      opName, BUILD_OPERATION_FLAG.color,
                      BUILD_OPERATION_FLAG.secondaryColor);
                }
              }
            }
          }
        }

        if (Memory.auto.build === true && spawn) {
          const eNodes = room.find(FIND_FLAGS, {filter: ENERGY_NODE_FLAG});
          if (eNodes.length > 0) {
            // Initialize Build Operation for other structures once
            // EnergyNetwork is online
            const sites = room.find(FIND_MY_CONSTRUCTION_SITES);
            for (const site of sites) {
              // Check for existing source builder flag or global room build
              // flag
              if (!Game.flags['build-' + site.id] &&
                  !Game.flags['build-op-' + room.name]) {
                site.pos.createFlag(
                    'build-op-' + room.name, BUILD_OPERATION_FLAG.color,
                    BUILD_OPERATION_FLAG.secondaryColor);
              }
            }
          }
        }

        if (Memory.auto.upgrade) {
          // HACK for now
          const coreNodes =
              room.find(FIND_FLAGS, {filter: CORE_ENERGY_NODE_FLAG});
          if (coreNodes.length > 0) {
            // Initialize the Upgrade Operation once the Energy Network is
            // online
            if (controller) {
              if (!Game.flags[`upgrade_op_${room.name}`]) {
                controller.pos.createFlag(
                    `upgrade_op_${room.name}`, UPGRADE_OPERATION_FLAG.color,
                    UPGRADE_OPERATION_FLAG.secondaryColor);
              }
            }
          }
        }

        if (Memory.auto.base && spawn) {
          // Initialize the Base Operation once the Energy Network is online
          const tsPos = room.getPositionAt(spawn.pos.x, spawn.pos.y - 2);
          if (!Game.flags[`base_op_${room.name}`]) {
            tsPos!.createFlag(
                `base_op_${room.name}`, BASE_OPERATION_FLAG.color,
                BASE_OPERATION_FLAG.secondaryColor);
          }

          // Initialize Base Layout once Energy Network is online, at the base
          // location.
          // if (!Game.flags.town_square) {
          //   tsPos!.createFlag(
          //       'town_square', TOWN_SQUARE_FLAG.color,
          //       TOWN_SQUARE_FLAG.secondaryColor);
          // }
        }
      }
    }
  }

  // SpawnQueue must execute after missions have a chance request creeps
  for (const name in global.spawnQueues) {
    if ({}.hasOwnProperty.call(global.spawnQueues, name)) {
      const queue = global.spawnQueues[name];
      queue.run();
    }
  }

  for (const name in Game.creeps) {
    if ({}.hasOwnProperty.call(Game.creeps, name)) {
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
  }

  // Convert excess CPU into Pixels
  if (Game.cpu.bucket > 9000 && Game.cpu.generatePixel) {
    // We have CPU to spare
    Game.cpu.generatePixel();
  }
};
