import {TerrainMatrix} from '@brisberg/screeps-server-mockup';
import {readFileSync} from 'fs';

import {helper} from './helper';
import {addContainer, getController} from './roomObjectsHelper';

const DIST_MAIN_JS = 'lib/main.js';

/**
 * Integration Test package to test if we can successfully upgrade a controller
 */
const clearTerrain = '0'.repeat(2500);

describe('upgrade operation', () => {
  const room = 'W0N1';

  beforeEach(async () => {
    const world = helper.server.world;
    // create a stub world composed of 9 rooms with sources and controller
    // await helper.server.world.stubWorld();

    // add basic room and room objects
    await world.addRoom(room);
    await world.setTerrain(room, TerrainMatrix.unserialize(clearTerrain));
    await world.addRoomObject(room, 'controller', 25, 25, {level: 0});

    // add a player with the built lib/main.js file
    const modules = {
      main: readFileSync(DIST_MAIN_JS).toString(),
    };
    helper.player = await helper.server.world.addBot(
        {username: 'player', room, x: 25, y: 15, modules});

    // Subscribe to player's console output
    helper.player.on(
        'console', (log: string[], results, userid, username: string) => {
          for (const line of log) {
            console.log(`\t[${username}]: ${line}`);
          }
        });

    // Start server
    await helper.server.start();
  });

  it('when fully stocked will upgrade controller', async () => {
    jest.setTimeout(30000);
    const world = helper.server.world;
    const {db, C} = await world.load();
    // Starting energy in the container
    const INITIAL_ENERGY = 1000;
    // Expected final controller progress. Upgrade from RCL1->RCL2 + extra
    const TARGET_PROGRESS = INITIAL_ENERGY - C.CONTROLLER_LEVELS[1];
    // Test fails with a timeout after this many ticks
    const TIMEOUT_TICKS = 2000;

    // Claim the room for the player
    // await claimRoomForPlayer(room, helper.player);

    // Add Upgrade Container, RCL3 Spawn, and Empty Storage
    await addContainer(room, 25, 23, INITIAL_ENERGY);  // Upgrade container
    await world.addRoomObject(room, C.STRUCTURE_STORAGE, 25, 17, {
      store: {
        energy: 0,
      },
      storeCapacityResource: {energy: 1000000},
    });
    await db['rooms.objects'].update({room, type: C.STRUCTURE_SPAWN}, {
      $set: {
        store: {
          energy: 50000,
        },
        storeCapacityResource: {energy: 800},
      },
    });

    // Launch Upgrade Operation (with flag on Controller)
    // await setFlag(
    //     helper.player, room, 'upgrade_op', 8, 43, C.COLOR_PURPLE,
    //     C.COLOR_PURPLE);
    await helper.player.console(
        `Memory.auto = {upgrade: true, enetwork: true}`);

    // Run the test until passing conditions
    let controller = await getController(room);
    let gameTime = 0;
    while (gameTime < TIMEOUT_TICKS && controller.progress < TARGET_PROGRESS) {
      await helper.server.tick();

      gameTime = await world.gameTime;
      controller = await getController(room);
    }

    const creeps = await db['rooms.objects'].find({room, type: 'creep'});
    console.log(`Ended with ${creeps.length} upgrader creeps.`);
    console.log(`Upgrade Operation completed in ${gameTime} ticks.`);

    // `Upgrade Operation failed to upgrade controller by ${
    //   INITIAL_ENERGY} in ${TIMEOUT_TICKS} ticks.`
    expect(controller.progress).toEqual(TARGET_PROGRESS);
  });
});
