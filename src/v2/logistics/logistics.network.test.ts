
import {TerrainMatrix} from '@brisberg/screeps-server-mockup';
import {ScreepsServer} from '@brisberg/screeps-server-mockup';
import User from '@brisberg/screeps-server-mockup/dist/src/user';
import World from '@brisberg/screeps-server-mockup/dist/src/world';
import {readFileSync} from 'fs';

const DIST_MAIN_JS = 'dist/main.js';

/**
 * Integration test to determine if the Logistics.Network works
 * as expected.
 */

const clearTerrain = '0'.repeat(2500);

describe('Logistics Network Test', () => {
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
    await world.setTerrain(room, TerrainMatrix.unserialize(clearTerrain));
    await world.addRoomObject(room, 'controller', 25, 25, {level: 0});

    // add a player with the built dist/main.js file
    const modules = {
      main: readFileSync(DIST_MAIN_JS).toString(),
    };
    player = await world.addBot(
        {username: 'player', gcl: 10, room, x: 35, y: 20, modules});

    // Destination Container
    const cont1 = await world.addRoomObject(
        room, 'container', 10, 10, {
            user: player.id,
            hits: 200000,
            store: {
              energy: 0,
            },
            storeCapacityResource: {energy: 2000},
          });

    // Source Container 1
    const cont2 = await world.addRoomObject(
    room, 'container', 20, 15, {
        user: player.id,
        hits: 200000,
        store: {
            energy: 1000,
        },
        storeCapacityResource: {energy: 2000},
        });

    // Source Container 2
    const cont3 = await world.addRoomObject(
    room, 'container', 5, 15, {
        user: player.id,
        hits: 200000,
        store: {
            energy: 1000,
        },
        storeCapacityResource: {energy: 2000},
        });

    await player.console(`Memory.networks['W1N1'].requests[1] = {
        id: 1,
        resource: RESOURCE_ENERGY,
        request: 'pickup',
        type: 'structure',
        targetId: ${cont2.id},
        amount: 1000,
        buffer: 2000,
        delta: 0,
        timeout: 20000,
      };`);
    await player.console(`Memory.networks['W1N1'].requests[2] = {
        id: 2,
        resource: RESOURCE_ENERGY,
        request: 'pickup',
        type: 'structure',
        targetId: ${cont3.id},
        amount: 1000,
        buffer: 2000,
        delta: 0,
        timeout: 20000,
      }`);
    await player.console(`Memory.networks['W1N1'].requests[2] = {
        id: 3,
        resource: RESOURCE_ENERGY,
        request: 'deliver',
        type: 'structure',
        targetId: ${cont1.id},
        amount: 2000,
        buffer: 2000,
        delta: 0,
        timeout: 20000,
      }`);

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
    async function getContainer(roomname: string): Promise<any|null> {
      return db['rooms.objects'].findOne({room: roomname, type: 'container'});
    }

    // Run the test until passing conditions
    let container = await getContainer(room);
    console.log(JSON.stringify(container));
    let gameTime = 0;
    let cpuTotal = 0;
    while (gameTime < TIMEOUT_TICKS && container.store.energy < 2000) {
      await server.tick();

      const notifications = await player.notifications;
      notifications.forEach(({message}) => {
        console.log(message);
      });

      gameTime = await world.gameTime;
      cpuTotal += await player.lastUsedCpu;
      container = await getContainer(room);
    }

    const creeps = await db['rooms.objects'].find({room, type: 'creep'});
    console.log(`Ended with ${creeps.length} hauler creeps.`);
    console.log(`Network Transfer completed in ${gameTime} ticks.`);
    console.log(`Average CPU used: ${cpuTotal / gameTime}.`);

    // `Logistics Network failed to transfer energy in ${TIMEOUT_TICKS} ticks.`
    expect(container.store.energy).toBe(2000);
  });
});
