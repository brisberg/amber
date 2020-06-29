import Operation from './operation';
import Mockoperation from './testing/operation-mock';

/**
 * Constructs a specific Operation Object from a type key and name.
 *
 * Expects the operation to already be initialized, so it can reuse existing
 * operation memory.
 */
export function constructOperationFromType(
    type: string, name: string): Operation|null {
  switch (type) {
    case Mockoperation.name:
      return new Mockoperation(name);
    default:
      return null;  // No operation definition found for type
  }
}
