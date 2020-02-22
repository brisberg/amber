import {EventEmitter} from 'events';

// tslint:disable:no-var-requires
const {readFileSync} = require('fs');
const _ = require('lodash');
const {ScreepsServer, stdHooks} = require('screeps-server-mockup');
const DIST_MAIN_JS = 'dist/main.js';

/*
 * Helper class for creating a ScreepsServer and resetting it between tests.
 * See https://github.com/screepers/screeps-server-mockup for instructions on
 * manipulating the terrain and game state.
 */
class IntegrationTestHelper {
  private _server: any;
  private _player: any;

  get server() {
    return this._server;
  }

  get player() {
    return this._player;
  }

  public async beforeEach() {
    this._server = new ScreepsServer();

    // reset world but add invaders and source keepers bots
    await this._server.world.reset();

    // create a stub world composed of 9 rooms with sources and controller
    await this._server.world.stubWorld();

    // add a player with the built dist/main.js file
    const modules = {
      main: readFileSync(DIST_MAIN_JS).toString(),
    };
    this._player = await this._server.world.addBot(
        {username: 'player', room: 'W0N1', x: 17, y: 45, modules});

    // Subscribe to player's console output
    (this._player as EventEmitter)
        .on('console', (log, results, userid, username) => {
          for (const line of log) {
            console.log(`\t${username}: ${line}`);
          }
        });

    // Start server
    await this._server.start();
  }

  public async afterEach() {
    await this._server.stop();
  }
}

beforeEach(async () => {
  await helper.beforeEach();
});

afterEach(async () => {
  await helper.afterEach();
});

before(() => {
  stdHooks.hookWrite();
});

export const helper = new IntegrationTestHelper();
