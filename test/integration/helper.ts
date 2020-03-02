import {ScreepsServer, stdHooks} from 'screeps-server-mockup';
import User from 'screeps-server-mockup/dist/src/user';

/*
 * Helper class for creating a ScreepsServer and resetting it between tests.
 * See https://github.com/screepers/screeps-server-mockup for instructions on
 * manipulating the terrain and game state.
 */
class IntegrationTestHelper {
  private _server: ScreepsServer|null = null;
  private _player: User|null = null;

  get server() {
    return this._server!;
  }

  get player() {
    return this._player!;
  }

  set player(player: User) {
    this._player = player;
  }

  public async beforeEach() {
    this._server = new ScreepsServer();

    // reset world but add invaders and source keepers bots
    await this._server.world.reset();
  }

  public afterEach() {
    if (this._server) {
      this._server.stop();
    }
  }
}

beforeEach(async () => {
  await helper.beforeEach();
});

afterEach(() => {
  helper.afterEach();
});

before(() => {
  stdHooks.hookWrite();
});

export const helper = new IntegrationTestHelper();
