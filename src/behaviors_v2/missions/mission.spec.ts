import {MissionMemory} from 'missions/mission';
import {mockGlobal, mockInstanceOf} from 'screeps-jest';
import {WORKER} from 'spawn-system/bodyTypes';
import {SpawnQueue, SpawnRequest} from 'spawn-system/spawnQueue';

import {Mission} from './mission';

interface MockMissionMemory extends MissionMemory {
  creeps: string[];
  nextCreep: string;
  missionData: string;  // Arbitrary data pretaining to the mission
}

class MockMission extends Mission<MockMissionMemory> {
  protected maxCreeps = 1;
  protected bodyType = WORKER;
}

fdescribe('Abstract Mission', () => {
  let mission: MockMission;

  beforeEach(() => {
    mission = new MockMission('mission-name');
    mockGlobal<{[roomname: string]: SpawnQueue}>('spawnQueues', {
      'N1W1': mockInstanceOf<SpawnQueue>(),
    });
  });

  // Spawning Behavior
  it('should request a new creep when below a full complement', () => {
    mission.rollCall();

    expect(global.spawnQueues['N1W1'].requestCreep)
        .toHaveBeenCalledWith<[SpawnRequest]>({
          bodyOptions: {},
          bodyRatio: WORKER,
          mission: mission.name,
          priority: 2,
        });
  });
});
