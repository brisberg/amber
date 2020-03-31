/* eslint-disable @typescript-eslint/ban-ts-ignore */
import {assert} from 'chai';
import {loop} from '../../src/main';
import {Game, Memory} from './mock';

describe('main', () => {
  before(() => {
    // runs before all tests in this block
    return;
  });

  beforeEach(() => {
    // runs before each test in this block
    // @ts-ignore : allow adding Game to global
    global.Game = _.clone(Game);
    // @ts-ignore: allow modifying Game on global
    global.Game.spawns.Spawn1 = {room: {name: 'W1N1', find: (): [] => []}};
    // @ts-ignore: allow modifying Rooms on global
    global.Game.rooms.W1N1 = {
      find: (): [] => [],
      name: 'W1N1',
    };
    // @ts-ignore : allow adding Memory to global
    global.Memory = _.clone(Memory);
  });

  it('should export a loop function', () => {
    assert.isTrue(typeof loop === 'function');
  });

  it('should return void when called with no context', () => {
    assert.isUndefined(loop());
  });
});
