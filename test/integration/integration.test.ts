import {readFileSync} from 'fs';

import {helper} from './helper';

const DIST_MAIN_JS = 'dist/main.js';

describe.only('main', () => {
  beforeEach(async () => {
    // create a stub world composed of 9 rooms with sources and controller
    await helper.server.world.stubWorld();

    // add a player with the built dist/main.js file
    const modules = {
      main: readFileSync(DIST_MAIN_JS).toString(),
    };
    helper.player = await helper.server.world.addBot(
        {username: 'player', room: 'W0N1', x: 17, y: 45, modules});

    // Subscribe to player's console output
    helper.player.on(
        'console',
        (log: string[], results: Record<string, unknown>, userid: string,
         username: string) => {
          for (const line of log) {
            console.log(`\t[${username}]: ${line}`);
          }
        });

    // Start server
    await helper.server.start();
  });

  it('runs a server and matches the game tick', async () => {
    for (let i = 1; i < 10; i += 1) {
      expect(await helper.server.world.gameTime).toEqual(i);
      await helper.server.tick();
    }
  });

  it('writes and reads to memory', async () => {
    await helper.player.console(`Memory.foo = 'bar'`);
    await helper.server.tick();
    const memory = JSON.parse(await helper.player.memory);
    expect(memory.foo).toEqual('bar');
  });
});
