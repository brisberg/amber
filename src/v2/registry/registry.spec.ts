import {mockGlobal} from 'screeps-jest';

import {Registry} from './registry';
import {mockFromTypeFn, MockRegisterable} from './testing/registerable.mock';

describe('Registry', () => {
  let registry: Registry<MockRegisterable>;
  let obj: MockRegisterable;
  const OBJECT_NAME = 'registerable';

  beforeEach(() => {
    // Mock memory to initialize registerables
    mockGlobal<Memory>('Memory', {missions: {}}, true);

    // Initialize test variables
    registry = new Registry<MockRegisterable>(mockFromTypeFn);
    obj = new MockRegisterable(OBJECT_NAME);
  });

  describe('Init', () => {
    it('should initialize objects from existing memory (ex. missions)', () => {
      mockGlobal<Memory>('Memory', {
        missions: {
          'obj1': {type: MockRegisterable.name},
          'obj2': {type: MockRegisterable.name},
        },
      });

      registry.init(Memory.missions);

      const obj1 = registry.get('obj1');
      expect(obj1).toBeDefined();
      expect(obj1 instanceof MockRegisterable).toBeTruthy();
      const obj2 = registry.get('obj2');
      expect(obj2).toBeDefined();
      expect(obj2 instanceof MockRegisterable).toBeTruthy();
    });

    it.todo('should refresh from flags?');
  });

  describe('Refresh', () => {
    it('should refresh all objects each tick', () => {
      const obj1 = new MockRegisterable('obj1');
      obj1.mockFinalizeFn = jest.fn();
      const obj2 = new MockRegisterable('obj2');
      obj2.mockFinalizeFn = jest.fn();
      registry.register(obj1);
      registry.register(obj2);

      registry.refresh();

      expect(obj1.mockFinalizeFn).toHaveBeenCalled();
      expect(obj2.mockFinalizeFn).toHaveBeenCalled();
    });
  });

  describe('Register', () => {
    it('should register a new mission', () => {
      registry.register(obj);

      expect(registry.get(OBJECT_NAME)).toBe(obj);
    });

    it('should return the newly registered mission', () => {
      const result = registry.register(obj);

      expect(result).toBe(obj);
    });

    it('should overwrite an existing mission when re-registering', () => {
      const obj2 = new MockRegisterable(OBJECT_NAME);
      registry.register(obj);

      registry.register(obj2);  // Overwrite

      expect(registry.get(OBJECT_NAME)).toBe(obj2);
    });

    it('should return null when fetching a non-existant mission', () => {
      expect(registry.get(OBJECT_NAME)).toBeNull();
    });
  });

  describe('Unregister', () => {
    it('should unregister a mission with a Registerable Object', () => {
      registry.register(obj);

      registry.unregister(obj);

      expect(registry.get(OBJECT_NAME)).toBeNull();
    });

    it('should unregister a mission with a name', () => {
      registry.register(obj);

      registry.unregister(OBJECT_NAME);

      expect(registry.get(OBJECT_NAME)).toBeNull();
    });

    it('should return true when successfully unregistering a mission', () => {
      registry.register(obj);

      const result = registry.unregister(OBJECT_NAME);

      expect(result).toBeTruthy();
    });

    it('unregistering an un-registered mission should return false', () => {
      const result = registry.unregister(OBJECT_NAME);

      expect(result).toBeFalsy();
    });
  });

  describe('List', () => {
    it('should return an empty array if Registry is empty', () => {
      expect(registry.list()).toEqual([]);
    });

    it('should return an array of all Registerables registered', () => {
      registry.register(obj);

      expect(registry.list()).toEqual([obj]);
    });
  });
});
