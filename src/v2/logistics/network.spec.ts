import {mockGlobal} from 'screeps-jest';
import {setupGlobal} from 'v2/global';
import TransportMsn from 'v2/missions/logistics/transport.msn';
import Mission from 'v2/missions/mission';
import {getMemory as getMsnMemory} from 'v2/missions/utils';
import {Registry} from 'v2/registry/registry';

import Network from './network';

describe('Logistics Network', () => {
  const NETWORK_NAME = 'W1N1';
  let msnRegistry: Registry<Mission>;

  beforeEach(() => {
    mockGlobal<Memory>(
        'Memory', {
          operations: {},
          missions: {},
        },
        true);
    setupGlobal();
    msnRegistry = global.msnRegistry;
  });

  describe('Requests', () => {
    it.todo('should register a new request');

    it.todo('should unregister an existing request');

    it.todo('should update an existing request');

    it.todo('should return null when fetching missing requests');
  });

  it('should launch a TransportMsn', () => {
    const network = new Network(NETWORK_NAME);

    network.run();

    const msn = msnRegistry.get(`${NETWORK_NAME}-tsp`);
    expect(msn).toBeTruthy();
    if (msn) {
      const msnMem = getMsnMemory(msn);
      expect(msnMem.type).toBe(TransportMsn.name);
      expect(msnMem.data.throughput).toEqual(0);
    }
  });

  it.todo('should configure TransportMsn max throughput based on requests');

  describe('Route Plans', () => {
    it.todo('should assign new requests to the temporally closest creep');

    it.todo(`should assign large requests to the temporally closest
    several creeps'`);

    it.todo('should assign idle, non-empty creeps to deliver to storage');

    it.todo('should assign old creeps to deliver to storage');
  });
});
