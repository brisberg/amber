import {FromTypeFn, Registerable} from '../registerable';

/** Concrete implementation of Registerable for use in tests */
export class MockRegisterable implements Registerable {
  constructor(public name: string) {}

  public mockFinalizeFn = (): void => {
    return;
  };

  refresh(): void {
    return this.mockFinalizeFn();
  }
}

export const mockFromTypeFn: FromTypeFn<MockRegisterable> =
    (type: string, name: string) => {
      switch (type) {
        case MockRegisterable.name:
          return new MockRegisterable(name);
        default:
          return null;  // No mission definition found for type
      }
    };
