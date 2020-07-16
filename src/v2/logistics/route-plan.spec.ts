import {mockGlobal, mockInstanceOf} from 'screeps-jest';

import {Request} from './request';
import {
  appendRequestToPlan,
  newEmptyRoutePlan,
  RoutePlan,
  RoutePlanStep,
} from './route-plan';

describe('Route Plan', () => {
  let request: Request;
  let creep: Creep;
  let container: StructureContainer;

  beforeEach(() => {
    request = {
      id: 123,
      resource: RESOURCE_ENERGY,
      type: 'structure',
      request: 'pickup',
      amount: 150,
      buffer: 2000,
      delta: 0,
      targetId: 'container1' as Id<StructureContainer>,
      timeout: 1000,
      persistent: false,
    };
    creep = mockInstanceOf<Creep>(
        {
          pos: new RoomPosition(5, 5, 'W1N1'),
          store: {
            energy: 100,
            getCapacity: (): number => 1600,
            getFreeCapacity: (): number => 1500,
          },
        },
        true);
    container = mockInstanceOf<StructureContainer>({
      id: 'container1' as Id<StructureContainer>,
      pos: {
        x: 10,
        y: 5,
        roomName: 'W1N1',
        findPathTo: (): Array<never> => new Array<never>(5),
      },
      store: {
        energy: 150,
        getFreeCapacity: (): number => 1000,
      },
    });
    mockGlobal<Game>('Game', {
      getObjectById: (id: Id<StructureContainer>) => {
        switch (id) {
          case container.id:
            return container;
          default:
            return null;
        }
      },
    });
  });

  it('should produce a reasonable default', () => {
    creep.pos = new RoomPosition(5, 5, 'W1N1');
    creep.store = {
      energy: 100,
      getCapacity: (): number => 1600,
      getFreeCapacity: (): number => 1500,
    } as Store<ResourceConstant, false>;
    const plan = newEmptyRoutePlan(creep);

    expect(plan.steps).toEqual<RoutePlanStep[]>([]);
    expect(plan.capacity).toBe(1600);
    expect(plan.end).toEqual<RoutePlan['end']>({
      pos: {x: 5, y: 5, room: 'W1N1'},
      time: 0,
      store: {
        energy: 100,
      },
      freeCapacity: 1500,
    });
  });

  it('should append a request to a plan', () => {
    const plan = newEmptyRoutePlan(creep);
    appendRequestToPlan(plan, request);

    expect(plan.steps).toHaveLength(1);
    const step = plan.steps[0];
    expect(step.requestId).toBe(request.id);
    expect(step.duration).toBe(5);
    expect(step.payload).toEqual({energy: 150});
  });

  it('should update final PlanState for the new request', () => {
    const plan = newEmptyRoutePlan(creep);
    appendRequestToPlan(plan, request);

    expect(plan.end.freeCapacity).toBe(1350);
    expect(plan.end.time).toEqual(5);
    expect(plan.end.store).toEqual({energy: 250});
    // TODO: Add a custom matcher for RoomPosition/ProtoPos interop
    expect(plan.end.pos.x).toEqual(container.pos.x);
    expect(plan.end.pos.y).toEqual(container.pos.y);
    expect(plan.end.pos.room).toEqual(container.pos.roomName);
  });

  it(`should update final PlanState after adding a 'pickup' request`, () => {
    creep.store.energy = 250;
    creep.store.getFreeCapacity =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((): number => 1600 - creep.store.energy) as any;
    const plan = newEmptyRoutePlan(creep);
    request.request = 'pickup';
    request.amount = 100;
    appendRequestToPlan(plan, request);

    expect(plan.end.freeCapacity).toBe(1250);
    expect(plan.end.store).toEqual({energy: 350});
  });

  it(`should update plan final store after adding a 'delivery' request`, () => {
    creep.store.energy = 250;
    creep.store.getFreeCapacity =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((): number => 1600 - creep.store.energy) as any;
    const plan = newEmptyRoutePlan(creep);
    request.request = 'delivery';
    request.amount = 100;
    appendRequestToPlan(plan, request);

    expect(plan.end.freeCapacity).toBe(1450);
    expect(plan.end.store).toEqual({energy: 150});
  });

  it('should throw an error if request target cannot be found', () => {
    Game.getObjectById = () => null;
    const plan = newEmptyRoutePlan(creep);

    expect(() => appendRequestToPlan(plan, request))
        .toThrowError(new Error('Target not found.'));
  });

  it.todo('should remove a request from a plan');

  it.todo('should recalculate the end state estimate without the request');
});
