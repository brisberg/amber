import {mockGlobal, mockInstanceOf} from 'screeps-jest';
import {WORKER} from 'spawn-system/bodyTypes';
import {SpawnQueue} from 'spawn-system/spawnQueue';

import Mission, {MissionMemory} from './mission';

interface MockMissionData {
  missionData: string;  // Arbitrary data pretaining to the mission
}

class MockMission extends Mission<MockMissionData> {
  protected maxCreeps = 1;
  protected bodyType = WORKER;

  protected initMemory(): MockMissionData {
    return {
      missionData: 'foobar',
    };
  }
}

describe('Abstract Mission', () => {
  let mission: MockMission;

  beforeEach(() => {
    mockGlobal<{[roomname: string]: SpawnQueue}>('spawnQueues', {
      'N1W1': mockInstanceOf<SpawnQueue>(),
    });
    mockGlobal<Memory>('Memory', {
      missions: {},
    });

    mission = new MockMission('mission-name', 'N1W1');
  });

  // Memory initialization
  it('should initialize Memory with mission memory on initialization', () => {
    const msn = new MockMission('mockMission', 'N1W1');

    expect(msn.name).toBe('mockMission');
    expect(Memory.missions['mockMission']).toBeDefined();
    const mem: MissionMemory<MockMissionData> = Memory.missions['mockMission'];
    expect(mem.creeps).toEqual([]);
    expect(mem.colony).toEqual('N1W1');
    expect(mem.data).toEqual({missionData: 'foobar'});
  });

  // Spawning Behavior
  it('should request a new creep when below a full complement', () => {
    mission.rollCall();

    expect(global.spawnQueues['N1W1'].requestCreep).toHaveBeenCalled();
  });
});
