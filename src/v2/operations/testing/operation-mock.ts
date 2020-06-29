import {WORKER} from 'spawn-system/bodyTypes';

import Operation, {OperationMemory} from '../operation';

/**
 * Fake Implementation Class for Abstract Operation
 *
 * Suitable for testing.
 */
export interface MockOperationData {
  mockDataField?: string;  // Arbitrary data pretaining to the operation
  [key: string]: string|undefined;
}

export interface MockOperationConfig {
  mockDataField: string;
  [key: string]: string|undefined;
}

export default class MockOperation extends
    Operation<MockOperationData, MockOperationConfig> {
  protected bodyType = WORKER;

  // Expose internal state TODO: remove this?
  public get mockMemory(): OperationMemory<MockOperationData> {
    return this.mem;
  }

  // Overwrite these values to mock internal state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public mockInitializeFn = (config: MockOperationConfig): void => {
    return;
  };
  public mockReconcileFn = (): void => {
    return;
  };
  public mockRunFn = (): void => {
    return;
  };
  public mockFinalizeFn = (): void => {
    return;
  };


  // Abstract Overrides
  protected initialize(config: MockOperationConfig): this {
    this.mockInitializeFn(config);
    return this;
  }

  protected reconcile(): void {
    this.mockReconcileFn();
  }

  protected initMemory(config: MockOperationConfig): MockOperationData {
    return {
      mockDataField: config.mockDataField,
    };
  }

  public run(): void {
    return this.mockRunFn();
  }

  protected finalize(): void {
    this.mockFinalizeFn();
  }
}
