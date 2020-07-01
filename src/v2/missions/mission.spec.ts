import {mockGlobal, mockInstanceOf} from 'screeps-jest';
import {WORKER} from 'spawn-system/bodyTypes';
import {SpawnQueue, SpawnRequest} from 'spawn-system/spawnQueue';

import {MissionMemory} from './mission';
import MockMission,
{MockMissionConfig, MockMissionData} from './testing/mission.mock';
import {mockSpawnQueueInstance} from './testing/spawnQueue.mock';
import {getMemory} from './utils';

const MISSION_NAME = 'mission-name';

describe('Abstract Mission', () => {
  let mission: MockMission;
  const defaultConfig: MockMissionConfig = {
    mockDataField: 'foobar',
  };

  beforeEach(() => {
    // Set up Globals
    mockGlobal<Memory>('Memory', {
      missions: {
        [MISSION_NAME]: undefined,
      },
    });
  });

  describe('Initialization', () => {
    it('should construct with a name', () => {
      const msn = new MockMission(MISSION_NAME);

      expect(msn.name).toBe(MISSION_NAME);
    });

    // Memory initialization
    it('should store mission memory in Memory.missions[name]', () => {
      const msn = new MockMission(MISSION_NAME);

      msn.init('N1W1', defaultConfig);

      // Using 'toBe' to ensure they are the same object
      expect(Memory.missions[MISSION_NAME]).toBe(getMemory(msn));
    });

    it('should initialize default mission memory if none exists', () => {
      Memory.missions = {};
      const msn = new MockMission(MISSION_NAME);

      msn.init('N1W1', defaultConfig);

      const mem: MissionMemory<MockMissionData> = getMemory(msn);
      // TODO: May not work well with property renaming
      expect(mem.type).toEqual(MockMission.name);
      expect(mem.creeps).toEqual([]);
      expect(mem.colony).toEqual('N1W1');
      expect(mem.data).toBeDefined();
    });

    // Happens when reinitialized after a Global reset
    it('should reuse existing mission memory if it exists', () => {
      const existingMemory: MissionMemory<MockMissionData> = {
        type: MockMission.name,
        creeps: ['creep1'],
        colony: 'Wisteria',
        data: {mockDataField: 'Hyacinth'},
      };
      Memory.missions[MISSION_NAME] = existingMemory;
      const msn = new MockMission(MISSION_NAME);

      msn.init('N1W1', defaultConfig);

      expect(getMemory(msn)).toEqual(existingMemory);
    });

    it('should initialize custom mission data from config', () => {
      const msn = new MockMission(MISSION_NAME);

      msn.init('N1W1', {mockDataField: 'custom value'});

      const mem: MissionMemory<MockMissionData> = getMemory(msn);
      expect(mem.data.mockDataField).toEqual('custom value');
    });

    it('should run sub-class initializer', () => {
      const config: MockMissionConfig = {mockDataField: 'barbaz'};
      const msn = new MockMission(MISSION_NAME);
      msn.mockInitializeFn = jest.fn();

      msn.init('N1W1', config);

      expect(msn.mockInitializeFn).toHaveBeenCalledWith(config);
    });

    it('should call refresh after init', () => {
      const msn = new MockMission(MISSION_NAME);
      msn.refresh = jest.fn();

      msn.init('N1W1', defaultConfig);

      expect(msn.refresh).toHaveBeenCalled();
    });
  });

  describe('Refresh', () => {
    it('should call reconcile when refresh is called', () => {
      const msn = new MockMission(MISSION_NAME);
      msn.mockReconcileFn = jest.fn();

      msn.refresh();

      expect(msn.mockReconcileFn).toHaveBeenCalled();
    });
  });

  describe('Spawning', () => {
    // Spawning Behavior
    beforeEach(() => {
      // Set up Globals
      mockGlobal<{[roomname: string]: SpawnQueue}>('spawnQueues', {
        'N1W1': mockSpawnQueueInstance(),
      });

      mission = new MockMission(MISSION_NAME);
      mission.init('N1W1', defaultConfig);
    });

    it('should not request a new creep when at full capacity', () => {
      const creep1 = mockInstanceOf<Creep>({name: 'creep1'});
      const creep2 = mockInstanceOf<Creep>({name: 'creep2'});
      mission.assignCreep(creep1);
      mission.assignCreep(creep2);
      mission.mockMaxCreepsFn = (): number => 2;

      mission.rollCall();

      expect(global.spawnQueues['N1W1'].requestCreep).not.toHaveBeenCalled();
    });

    it('should request a new creep when below a full complement', () => {
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

    it('should aquire the nextCreep if it exists', () => {
      const creep = mockInstanceOf<Creep>({name: 'creep1'});
      spyOn(global.spawnQueues['N1W1'], 'requestCreep')
          .and.returnValue(creep.name);
      mockGlobal<Game>('Game', {creeps: {[creep.name]: creep}});
      mission.mockMaxCreepsFn = (): number => 1;
      mission.rollCall();  // Request a new creep

      mission.rollCall();  // Aquire creep requested last tick

      expect(mission.mockMemory.creeps).toEqual([creep.name]);
      expect(mission.mockMemory.nextCreep).toBeUndefined();
    });

    it('should ignore a nextCreep if it was not spawned', () => {
      spyOn(global.spawnQueues['N1W1'], 'requestCreep')
          .and.returnValues('notSpawnedCreep', 'nextCreep');
      mockGlobal<Game>('Game', {creeps: {}}, true);
      mission.rollCall();  // Request a new creep

      mission.rollCall();  // Fail to aquire the creep

      expect(mission.mockMemory.creeps).toEqual([]);
      expect(mission.mockMemory.nextCreep).toEqual('nextCreep');
    });
  });

  describe('Run', () => {
    it('should call sub-class actions when run', () => {
      mission = new MockMission(MISSION_NAME);
      mission.mockCreepActionsFn = jest.fn();
      mission.init('N1W1', defaultConfig);

      mission.run();

      expect(mission.mockCreepActionsFn).toHaveBeenCalled();
    });
  });

  describe('Retire', () => {
    beforeEach(() => {
      // Allow undefined because memory may be cleared
      mockGlobal<Memory>('Memory', {missions: {}}, true);
      mission = new MockMission(MISSION_NAME);
      mission.init('N1W1', defaultConfig);
    });

    it('should call sub-class finalize when retired', () => {
      mission.mockFinalizeFn = jest.fn();
      mission.retire();

      expect(mission.mockFinalizeFn).toHaveBeenCalled();
    });

    it('should clear mission memory', () => {
      mission.retire();

      expect(getMemory(mission)).toBeUndefined();
    });

    it.skip('should release all of the missions creeps', () => {
      mission.retire();

      // TODO:
      // expect(mission.creeps).toBeReleased()
    });
  });
});
