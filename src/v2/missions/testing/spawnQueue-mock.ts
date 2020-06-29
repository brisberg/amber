import {mockInstanceOf} from 'screeps-jest';
import {SpawnQueue} from 'spawn-system/spawnQueue';

/** Utility to create a minimum mock instance of a Spawn Queue. */
export function mockSpawnQueueInstance(): SpawnQueue {
  return mockInstanceOf<SpawnQueue>({
    requestCreep: (): void => {
      return;
    },
  });
}
