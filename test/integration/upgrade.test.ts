import {expect} from 'chai';

import {helper} from './helper';
import {addContainer, getController, setFlag} from './roomObjectsHelper';

/**
 * Integration Test package to test if we can successfully upgrade a controller
 */

describe('upgrade operation', () => {
  it('when fully stocked will upgrade controller', async () => {
    const room = 'W0N1';
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

    // Add Container and Spawn
    await addContainer(room, 8, 45, INITIAL_ENERGY);  // Upgrade container
    await db['rooms.objects'].update({room, type: C.STRUCTURE_SPAWN}, {
      $set: {
        store: {
          energy: 50000,
        },
        storeCapacityResource: {energy: 800},
      },
    });

    // Launch Upgrade Operation (with flag on Controller)
    await setFlag(
        helper.player, room, 'upgrade_op', 8, 43, C.COLOR_PURPLE,
        C.COLOR_PURPLE);

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

    expect(
        controller.progress,
        `Upgrade Operation failed to upgrade controller by ${
            INITIAL_ENERGY} in ${TIMEOUT_TICKS} ticks.`)
        .to.equal(TARGET_PROGRESS);
  });
});
