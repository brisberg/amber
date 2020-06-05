import {mockGlobal, mockInstanceOf} from 'screeps-jest';
import {WORKER} from 'spawn-system/bodyTypes';
import {SpawnQueue} from 'spawn-system/spawnQueue';

import Mission, {MissionMemory} from './mission';
import {getMemory} from './utils';

describe('Abstract Mission', () => {
  let mission: MockMission;
  let mockData: MockMissionData;  // Initial mock mission data

  // Fake Implementation Class for Abstract Mission
  interface MockMissionData {
    missionData?: string;  // Arbitrary data pretaining to the mission
  }

  class MockMission extends Mission<MockMissionData> {
    protected maxCreeps = 1;
    protected bodyType = WORKER;

    protected initMemory(): MockMissionData {
      return mockData;
    }
  }

  beforeEach(() => {
    // Set up Globals
    mockGlobal<{[roomname: string]: SpawnQueue}>('spawnQueues', {
      'N1W1': mockInstanceOf<SpawnQueue>(),
    });
    mockGlobal<Memory>('Memory', {
      missions: {},
    });

    // Initialize test variables
    mockData = {};
    mission = new MockMission('mission-name', 'N1W1');
  });

  describe('Initialization', () => {
    // Memory initialization
    it('should store mission memory in Memory.missions[name]', () => {
      const msn = new MockMission('mission-name', 'N1W1');

      // Using 'toBe' to ensure they are the same object
      expect(Memory.missions['mission-name']).toBe(getMemory(msn));
    });

    it('should initialize default mission memory if none exists', () => {
      Memory.missions = {};
      const msn = new MockMission('mission-name', 'N1W1');

      expect(msn.name).toBe('mission-name');
      const mem: MissionMemory<MockMissionData> = getMemory(msn);
      expect(mem.creeps).toEqual([]);
      expect(mem.colony).toEqual('N1W1');
      expect(mem.data).toBeDefined();
    });

    // Happens when reinitialized after a Global refresh
    it('should reuse existing mission memory if it exists', () => {
      const existingMemory: MissionMemory<MockMissionData> = {
        creeps: ['creep1'],
        colony: 'Wisteria',
        data: {missionData: 'Hyacinth'},
      };
      Memory.missions = {
        'mission-name': existingMemory,
      };
      const msn = new MockMission('mission-name', 'N1W1');

      expect(getMemory(msn)).toEqual(existingMemory);
    });

    it('should initialize custom mission data on initialization', () => {
      mockData = {missionData: 'foobar'};
      const msn = new MockMission('mockMission', 'N1W1');

      const mem: MissionMemory<MockMissionData> = getMemory(msn);
      expect(mem.data).toEqual(mockData);
    });
  });

  describe.skip('Spawning', () => {
    // Spawning Behavior
    it('should request a new creep when below a full complement', () => {
      mission.rollCall();

      expect(global.spawnQueues['N1W1'].requestCreep).toHaveBeenCalled();
    });
  });
});
