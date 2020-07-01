import {WORKER} from 'spawn-system/bodyTypes';

import Mission, {MissionMemory} from '../mission';

/**
 * Fake Implementation Class for Abstract Mission
 *
 * Suitable for testing.
 */
export interface MockMissionData {
  mockDataField?: string;  // Arbitrary data pretaining to the mission
  [key: string]: string|undefined;
}

export interface MockMissionConfig {
  mockDataField: string;
  [key: string]: string|undefined;
}

export default class MockMission extends
    Mission<MockMissionData, MockMissionConfig> {
  protected bodyType = WORKER;

  // Expose internal state TODO: remove this?
  public get mockMemory(): MissionMemory<MockMissionData> {
    return this.mem;
  }


  // Overwrite these values to mock internal state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public mockInitializeFn = (config: MockMissionConfig): void => {
    return;
  };
  public mockReconcileFn = (): void => {
    return;
  };
  public mockMaxCreepsFn = (): number => 1;
  public mockCreepActionsFn = (): void => {
    return;
  };
  public mockFinalizeFn = (): void => {
    return;
  };


  // Abstract Overrides
  protected initialize(config: MockMissionConfig): this {
    this.mockInitializeFn(config);
    return this;
  }

  protected reconcile(): void {
    this.mockReconcileFn();
  }

  protected initMemory(config: MockMissionConfig): MockMissionData {
    return {
      mockDataField: config.mockDataField,
    };
  }

  protected get maxCreeps(): number {
    return this.mockMaxCreepsFn();
  }

  protected creepActions(): void {
    this.mockCreepActionsFn();
  }

  protected finalize(): void {
    this.mockFinalizeFn();
  }
}