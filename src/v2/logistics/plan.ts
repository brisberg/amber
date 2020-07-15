import {ProtoPos} from 'v2/types';

/** Series of Requests to fulfil constituting a plan for a Hauler */
export interface RoutePlan {
  steps: RoutePlanStep[];
  end: {
    pos: ProtoPos,
    time: number,
    store: Store<ResourceConstant, false>,
  };
}

/** A single step in a RoutePlan */
export interface RoutePlanStep {
  requestId: number;                        // Logistics.Request to be fulfilled
  duration: number;                         // Estimated travel time
  payload: Store<ResourceConstant, false>;  // Resouces transfered on arrival
}
