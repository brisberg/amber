import {mockGlobal} from 'screeps-jest';

import Operation from './Operation';
import {OperationRegistry} from './registry';
import MockOperation from './testing/operation-mock';

describe('Operation Registry', () => {
  let registry: OperationRegistry;
  let op: Operation;
  const OPERATION_NAME = 'Operation';

  beforeEach(() => {
    // Mock Operation memory to initialize Operations
    mockGlobal<Memory>('Memory', {Operations: {}}, true);

    // Initialize test variables
    registry = new OperationRegistry();
    op = new MockOperation(OPERATION_NAME);
  });

  it('should initialize Operations from existing Operation memorys', () => {
    mockGlobal<Memory>('Memory', {
      Operations: {
        'op1': {type: MockOperation.name},
        'op2': {type: MockOperation.name},
      },
    });

    registry.init();

    const op1 = registry.get('op1');
    expect(op1).toBeDefined();
    expect(op1 instanceof MockOperation).toBeTruthy();
    const op2 = registry.get('op2');
    expect(op2).toBeDefined();
    expect(op2 instanceof MockOperation).toBeTruthy();
  });

  it.todo('should refresh from flags?');

  describe('Register', () => {
    it('should register a new Operation', () => {
      registry.register(op);

      expect(registry.get(OPERATION_NAME)).toBe(op);
    });

    it('should return the newly registered Operation', () => {
      const result = registry.register(op);

      expect(result).toBe(op);
    });

    it('should overwrite an existing Operation when re-registering', () => {
      const op2 = new MockOperation(OPERATION_NAME);
      registry.register(op);

      registry.register(op2);  // Overwrite

      expect(registry.get(OPERATION_NAME)).toBe(op2);
    });

    it('should return null when fetching a non-existant Operation', () => {
      expect(registry.get(OPERATION_NAME)).toBeNull();
    });
  });

  describe('Unregister', () => {
    it('should unregister a Operation with a Operation Object', () => {
      registry.register(op);

      registry.unregister(op);

      expect(registry.get(OPERATION_NAME)).toBeNull();
    });

    it('should unregister a Operation with a name', () => {
      registry.register(op);

      registry.unregister(OPERATION_NAME);

      expect(registry.get(OPERATION_NAME)).toBeNull();
    });

    it('should return true when successfully unregistering a Operation', () => {
      registry.register(op);

      const result = registry.unregister(OPERATION_NAME);

      expect(result).toBeTruthy();
    });

    it('unregistering an un-registered Operation should return false', () => {
      const result = registry.unregister(OPERATION_NAME);

      expect(result).toBeFalsy();
    });
  });

  describe('List', () => {
    it('should return an empty array if Registry is empty', () => {
      expect(registry.list()).toEqual([]);
    });

    it('should return an array of all Operations registered', () => {
      registry.register(op);

      expect(registry.list()).toEqual([op]);
    });
  });
});
