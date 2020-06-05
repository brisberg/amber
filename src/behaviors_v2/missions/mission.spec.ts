import {mockGlobal, mockInstanceOf} from 'screeps-jest';
import {WORKER} from 'spawn-system/bodyTypes';
import {SpawnQueue, SpawnRequest} from 'spawn-system/spawnQueue';

import Mission, {MissionMemory} from './mission';
import {getMemory} from './utils';

const MISSION_NAME = 'mission-name';

/** Utility to create a minimum mock instance of a Spawn Queue. */
function mockSpawnQueueInstance(): SpawnQueue {
  return mockInstanceOf<SpawnQueue>({
    requestCreep: (): void => {
      return;
    },
  });
}

describe('Abstract Mission', () => {
  let mission: MockMission;
  let mockData: MockMissionData;  // Initial mock mission data

  // Fake Implementation Class for Abstract Mission
  interface MockMissionData {
    missionData?: string;  // Arbitrary data pretaining to the mission
  }

  class MockMission extends Mission<MockMissionData> {
    protected bodyType = WORKER;

    // Expose internal state TODO: remove this?
    public get mockMemory(): MissionMemory<MockMissionData> {
      return this.mem;
    }


    // Overwrite these values to mock internal state
    public mockMaxCreepsFn = (): number => 1;


    // Abstract Overrides
    protected initMemory(): MockMissionData {
      return mockData;
    }

    protected get maxCreeps(): number {
      return this.mockMaxCreepsFn();
    }
  }

  beforeEach(() => {
    // Set up Globals
    mockGlobal<Memory>('Memory', {
      missions: {
        [MISSION_NAME]: undefined,
      },
    });

    // Initialize test variables
    mockData = {};
  });

  describe('Initialization', () => {
    // Memory initialization

    it('should store mission memory in Memory.missions[name]', () => {
      const msn = new MockMission(MISSION_NAME, 'N1W1');

      // Using 'toBe' to ensure they are the same object
      expect(Memory.missions[MISSION_NAME]).toBe(getMemory(msn));
    });

    it('should initialize default mission memory if none exists', () => {
      Memory.missions = {};
      const msn = new MockMission(MISSION_NAME, 'N1W1');

      expect(msn.name).toBe(MISSION_NAME);
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
      Memory.missions[MISSION_NAME] = existingMemory;
      const msn = new MockMission(MISSION_NAME, 'N1W1');

      expect(getMemory(msn)).toEqual(existingMemory);
    });

    it('should initialize custom mission data on initialization', () => {
      mockData = {missionData: 'foobar'};
      const msn = new MockMission(MISSION_NAME, 'N1W1');

      const mem: MissionMemory<MockMissionData> = getMemory(msn);
      expect(mem.data).toEqual(mockData);
    });
  });

  describe('Spawning', () => {
    // Spawning Behavior
    beforeEach(() => {
      // Set up Globals
      mockGlobal<{[roomname: string]: SpawnQueue}>('spawnQueues', {
        'N1W1': mockSpawnQueueInstance(),
      });

      mission = new MockMission(MISSION_NAME, 'N1W1');
    });

    it('should not request a new creep when at full capacity', () => {
      // TODO: replace this with a public AssignCreep Api
      mission.mockMemory.creeps = ['creep1', 'creep2'];
      mission.mockMaxCreepsFn = (): number => 2;

      mission.rollCall();

      expect(global.spawnQueues['N1W1'].requestCreep).not.toHaveBeenCalled();
    });

    it('should request a new creep when below a full complement', () => {
      // TODO: replace this with a public AssignCreep Api
      mission.mockMemory.creeps = [];
      mission.mockMaxCreepsFn = (): number => 1;

      mission.rollCall();

      expect(global.spawnQueues['N1W1'].requestCreep).toHaveBeenCalled();
    });

    it('should request creeps with the appropriate arguments', () => {
      const requestCreepSpy = spyOn(global.spawnQueues['N1W1'], 'requestCreep');
      mission.rollCall();

      const request: SpawnRequest = requestCreepSpy.calls.mostRecent().args[0];
      expect(request.bodyRatio).toEqual(WORKER);  // From Sub-Class
      expect(request.priority).toEqual(1);
      expect(request.mission).toEqual(mission.name);
    });

    it('should request creeps from foreign spawnSource if set', () => {
      mockGlobal<{[roomname: string]: SpawnQueue}>('spawnQueues', {
        'N1W1': mockSpawnQueueInstance(),
        'Narnia': mockSpawnQueueInstance(),
      });

      mission.setSpawnSource('Narnia');
      mission.rollCall();

      expect(global.spawnQueues['N1W1'].requestCreep).not.toHaveBeenCalled();
      expect(global.spawnQueues['Narnia'].requestCreep).toHaveBeenCalled();
    });
  });
});
