import {ScreepsServer, stdHooks} from '@brisberg/screeps-server-mockup';
import User from '@brisberg/screeps-server-mockup/dist/src/user';

/*
 * Helper class for creating a ScreepsServer and resetting it between tests.
 * See https://github.com/screepers/screeps-server-mockup for instructions on
 * manipulating the terrain and game state.
 */
class IntegrationTestHelper {
  private _server: ScreepsServer|null = null;
  private _player: User|null = null;

  get server(): ScreepsServer {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this._server!;
  }

  get player(): User {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this._player!;
  }

  set player(player: User) {
    this._player = player;
  }

  public async beforeEach(): Promise<void> {
    this._server = new ScreepsServer();

    // reset world but add invaders and source keepers bots
    await this._server.world.reset();
  }

  public afterEach(): void {
    if (this._server) {
      this._server.stop();
    }
  }
}

export const helper = new IntegrationTestHelper();

beforeEach(async () => {
  await helper.beforeEach();
});

afterEach(() => {
  helper.afterEach();
});

beforeAll(() => {
  stdHooks.hookWrite();
});
