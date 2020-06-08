import {mockGlobal, mockInstanceOf} from 'screeps-jest';

import Mission from './mission';
import {MissionRegistry} from './registry';
import MockMission from './testing/mission-mock';

describe('Mission Registry', () => {
  let registry: MissionRegistry;
  let msn: Mission;
  const MISSION_NAME = 'mission';

  beforeEach(() => {
    // Mock mission memory to initialize missions
    mockGlobal<Memory>('Memory', {missions: {}}, true);

    // Initialize test variables
    registry = new MissionRegistry();
    msn = new MockMission(MISSION_NAME);
  });

  it('should initialize missions from existing flags', () => {
    const flags = [
      mockInstanceOf<Flag>({
        name: 'msn-flag-1',
        color: COLOR_BROWN,
        secondaryColor: COLOR_BROWN,
      }),
      mockInstanceOf<Flag>({
        name: 'msn-flag-2',
        color: COLOR_BROWN,
        secondaryColor: COLOR_BROWN,
      }),
    ];

    registry.init(flags);

    const msn1 = registry.get('msn-flag-1');
    expect(msn1).toBeDefined();
    expect(msn1 instanceof MockMission).toBeTruthy();
    const msn2 = registry.get('msn-flag-2');
    expect(msn2).toBeDefined();
    expect(msn2 instanceof MockMission).toBeTruthy();
  });

  it.todo('should refresh from flags?');

  describe('Register', () => {
    it('should register a new mission', () => {
      registry.register(msn);

      expect(registry.get(MISSION_NAME)).toBe(msn);
    });

    it('should return the newly registered mission', () => {
      const result = registry.register(msn);

      expect(result).toBe(msn);
    });

    it('should overwrite an existing mission when re-registering', () => {
      const msn2 = new MockMission(MISSION_NAME);
      registry.register(msn);

      registry.register(msn2);  // Overwrite

      expect(registry.get(MISSION_NAME)).toBe(msn2);
    });

    it('should return null when fetching a non-existant mission', () => {
      expect(registry.get(MISSION_NAME)).toBeNull();
    });
  });

  describe('Unregister', () => {
    it('should unregister a mission with a Mission Object', () => {
      registry.register(msn);

      registry.unregister(msn);

      expect(registry.get(MISSION_NAME)).toBeNull();
    });

    it('should unregister a mission with a name', () => {
      registry.register(msn);

      registry.unregister(MISSION_NAME);

      expect(registry.get(MISSION_NAME)).toBeNull();
    });

    it('should return true when successfully unregistering a mission', () => {
      registry.register(msn);

      const result = registry.unregister(MISSION_NAME);

      expect(result).toBeTruthy();
    });

    it('unregistering an un-registered mission should return false', () => {
      const result = registry.unregister(MISSION_NAME);

      expect(result).toBeFalsy();
    });
  });
});
