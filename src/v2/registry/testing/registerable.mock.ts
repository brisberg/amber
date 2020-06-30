import {FromTypeFn, Registerable} from '../registerable';

/** Concrete implementation of Registerable for use in tests */
export class MockRegisterable implements Registerable {
  constructor(public name: string) {}
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
