import {ProtoPos} from 'v2/types';
import {Request} from './request';

/** Series of Requests to fulfil constituting a plan for a Hauler */
export interface RoutePlan {
  steps: RoutePlanStep[];
  capacity: number;  // Capacity of the Hauler
  end: {
    pos: ProtoPos,
    time: number,
    store: StoreState,
    freeCapacity: number,
  };
}

/** Serializable Interface for the state of a Creep Store */
export interface StoreState {
  [res: string]: number;
}

/** State snapshot of the creep at a particular future time in the plan. */
export interface RoutePlanState {
  pos: ProtoPos;
  time: number;
  store: StoreState;
  freeCapacity: number;
}

/** A single step in a RoutePlan */
export interface RoutePlanStep {
  id: number;           // Id of this Step in the plan
  requestId: number;    // Logistics.Request to be fulfilled
  duration: number;     // Estimated travel time
  pos: ProtoPos;        // Destination position for this leg
  payload: StoreState;  // Resouces transfered on arrival
}

/**
 * Takes a existing PlanState and a Step and produces a new PlanState with the
 * Step applied to it.
 */
export function planStateReducer(
    state: RoutePlanState, step: RoutePlanStep): RoutePlanState {
  const store = {...state.store};
  let freeCapacity = state.freeCapacity;
  Object.keys(step.payload).forEach((resource: string) => {
    store[resource] = (store[resource] || 0) + step.payload[resource];
    freeCapacity -= step.payload[resource];
  });

  return {
    pos: step.pos,
    time: state.time + step.duration,
    store,
    freeCapacity,
  };
}

/** Create an empty RoutePlan */
export function newEmptyRoutePlan(creep: Creep): RoutePlan {
  const store: StoreState = {};
  for (const resource of RESOURCES_ALL) {
    if (creep.store[resource]) {
      store[resource] = creep.store[resource];
    }
  }

  return {
    steps: [],
    capacity: creep.store.getCapacity(),
    end: {
      pos: {x: creep.pos.x, y: creep.pos.y, room: creep.pos.roomName},
      time: 0,
      store,
      freeCapacity: creep.store.getFreeCapacity(),
    },
  };
}

/**
 * Append a Logistics.Request to an existing RoutePlan.
 * Returns the Plan for Chaining.
 */
export function appendRequestToPlan(
    plan: RoutePlan, request: Request): RoutePlan {
  const target = Game.getObjectById(request.targetId);

  if (!target) {
    throw new Error('Target not found.');
  }

  // TODO: Do a better estimate including swamps and terrain
  const path = target.pos.findPathTo(
      plan.end.pos.x,
      plan.end.pos.y,
      {range: 1},
  );
  const dist = path.length;

  const payload: StoreState = {};
  const RESOURCE = request.resource;
  if (request.request === 'pickup') {
    const amount =
        Math.min(target.store[RESOURCE], plan.end.freeCapacity, request.amount);
    payload[RESOURCE] = amount;
  } else {  // Delivery
    const targetFreeCapacity =
        (target.store as Store<ResourceConstant, false>).getFreeCapacity();
    const amount =
        Math.min(targetFreeCapacity, plan.end.store[RESOURCE], request.amount);
    payload[RESOURCE] = -amount;
  }

  let nextStepId = 0;

  if (plan.steps.length > 0) {
    nextStepId = plan.steps[plan.steps.length - 1].id++;
  }

  const step: RoutePlanStep = {
    id: nextStepId,
    requestId: request.id,
    duration: dist,
    payload,
    pos: {x: target.pos.x, y: target.pos.y, room: target.pos.roomName},
  };
  plan.steps.push(step);

  // Update End State
  plan.end = planStateReducer(plan.end, step);

  return plan;
}
