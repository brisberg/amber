import {TerrainMatrix} from '@brisberg/screeps-server-mockup';
import {readFileSync} from 'fs';

import {helper} from './helper';

const DIST_MAIN_JS = 'dist/main.js';

/**
 * Integration Test package to test if we can harvest from a source using a
 * container.
 */

const clearTerrain = '0'.repeat(2500);

describe('mining operation', () => {
  const room = 'W0N0';

  beforeEach(async () => {
    const world = helper.server.world;
    // create a stub world composed of 9 rooms with sources and controller
    // await helper.server.world.stubWorld();

    // add basic room and room objects
    await world.addRoom(room);
    await world.setTerrain(room, TerrainMatrix.unserialize(clearTerrain));
    await world.addRoomObject(room, 'controller', 25, 25, {level: 0});
    await world.addRoomObject(
        room, 'source', 35, 25,
        {energy: 1000, energyCapacity: 1000, ticksToRegeneration: 300});

    // add a player with the built dist/main.js file
    const modules = {
      main: readFileSync(DIST_MAIN_JS).toString(),
    };
    helper.player =
        await world.addBot({username: 'player', room, x: 35, y: 20, modules});

    // Subscribe to player's console output
    helper.player.on(
        'console', async (log: string[], results, userid, username) => {
          const time = await world.gameTime;
          for (const line of log) {
            console.log(`\t${time}:[${username}]: ${line}`);
          }
        });

    // Start server
    await helper.server.start();
  });

  it('will build and fill a container next to a source', async () => {
    jest.setTimeout(20000);
    const world = helper.server.world;
    const {db, C} = await world.load();
    // Test fails with a timeout after this many ticks
    const TIMEOUT_TICKS = 2000;
    // Expected final container contents. Container capacity minus one CARRY
    const TARGET_ENERGY = C.CONTAINER_CAPACITY - C.CARRY_CAPACITY;

    // Claim the room for the player
    // await claimRoomForPlayer(room, helper.player);

    // Upgrade Spawn to RCL3
    await db['rooms.objects'].update({room, type: C.STRUCTURE_SPAWN}, {
      $set: {
        store: {
          energy: 50000,
        },
        storeCapacityResource: {energy: 800},
      },
    });

    // Launch Mining Operation (with flag on Source)
    // await setFlag(
    //     helper.player, room, 'mining_op', 35, 25, C.COLOR_BROWN,
    //     C.COLOR_YELLOW);
    await helper.player.console(
        `Memory.auto = {sourceBuild: true, mining: true}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function getContainer(roomname: string): Promise<any|null> {
      return db['rooms.objects'].findOne(
          {room: roomname, type: C.STRUCTURE_CONTAINER});
    }

    // Run the test until passing conditions
    let container = await getContainer(room);
    let gameTime = 0;
    while (gameTime < TIMEOUT_TICKS &&
           (!container || container.store.energy < TARGET_ENERGY)) {
      await helper.server.tick();

      gameTime = await world.gameTime;
      container = await getContainer(room);
    }

    const creeps = await db['rooms.objects'].find({room, type: 'creep'});
    console.log(`Ended with ${creeps.length} harvester creeps.`);
    console.log(`Mining Operation completed in ${gameTime} ticks.`);

    // 'Mining Operation failed to construct a container.'
    expect(container).not.toBe(null);

    // `Mining Operation failed to fill container in ${TIMEOUT_TICKS} ticks.`
    expect(container.store.energy).toBeGreaterThan(TARGET_ENERGY);
  });
});
