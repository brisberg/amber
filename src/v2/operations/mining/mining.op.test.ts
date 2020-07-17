import {TerrainMatrix} from '@brisberg/screeps-server-mockup';
import {ScreepsServer} from '@brisberg/screeps-server-mockup';
import User from '@brisberg/screeps-server-mockup/dist/src/user';
import World from '@brisberg/screeps-server-mockup/dist/src/world';
import {readFileSync} from 'fs';

const DIST_MAIN_JS = 'dist/main.js';

/**
 * Integration Test package to test if we can harvest from a source using a
 * container.
 */

const clearTerrain = '0'.repeat(2500);

describe.skip('drop mining mission operation', () => {
  let server: ScreepsServer;
  let player: User;
  let world: World;
  const room = 'W1N1';

  beforeEach(async () => {
    server = new ScreepsServer();
    world = server.world;
    await world.load();

    // reset world but add invaders and source keepers bots
    await world.reset();

    // add basic room and room objects
    await world.addRoom(room);
    // Place wall where Source will go
    const terrain = clearTerrain.substr(0, 25 * 50 + 35) + TERRAIN_MASK_WALL +
        clearTerrain.substr(25 * 50 + 37, 2500);
    await world.setTerrain(room, TerrainMatrix.unserialize(terrain));
    await world.addRoomObject(room, 'controller', 25, 25, {level: 0});
    await world.addRoomObject(
        room, 'source', 35, 25,
        {energy: 1000, energyCapacity: 1000, ticksToRegeneration: 300});

    // add a player with the built dist/main.js file
    const modules = {
      main: readFileSync(DIST_MAIN_JS).toString(),
    };
    player = await world.addBot(
        {username: 'player', gcl: 10, room, x: 35, y: 20, modules});

    // Subscribe to player's console output
    player.on('console', async (log: string[], results, userid, username) => {
      const time = await world.gameTime;
      for (const line of log) {
        console.log(`\t${time}:[${username}]: ${line}`);
      }
    });

    // Start server
    await server.start();
  });

  afterEach(() => {
    if (server) {
      server.stop();
    }
  });

  it('will harvest the source until empty', async () => {
    jest.setTimeout(20000);
    const {db, C} = await world.load();
    // Test fails with a timeout after this many ticks
    const TIMEOUT_TICKS = 1000;

    // Upgrade Spawn to RCL2
    await db['rooms.objects'].update({room, type: C.STRUCTURE_SPAWN}, {
      $set: {
        store: {
          energy: 50000,
        },
        storeCapacityResource: {energy: 1000},
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function getSource(roomname: string): Promise<any|null> {
      return db['rooms.objects'].findOne({room: roomname, type: 'source'});
    }

    // Run the test until passing conditions
    let source = await getSource(room);
    let gameTime = 0;
    let cpuTotal = 0;
    while (gameTime < TIMEOUT_TICKS && source.energy > 0) {
      await server.tick();

      gameTime = await world.gameTime;
      cpuTotal += await player.lastUsedCpu;
      source = await getSource(room);
    }

    const creeps = await db['rooms.objects'].find({room, type: 'creep'});
    console.log(`Ended with ${creeps.length} harvester creeps.`);
    console.log(`Mining Operation completed in ${gameTime} ticks.`);
    console.log(`Average CPU used: ${cpuTotal / gameTime}.`);

    // `Mining Operation failed to exhaust source in ${TIMEOUT_TICKS} ticks.`
    expect(source.energy).toBe(0);
  });
});
