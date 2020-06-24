import './tower';

import {mockGlobal, mockInstanceOf, mockStructure} from 'screeps-jest';

const towerB = global.tower;

describe('tower module', () => {
  describe('runTower', () => {
    it('should attack the nearest hostile creep, if there is one in the room',
       () => {
         mockGlobal<Memory>('Memory', {
           rooms: {
             'W1N1': {damaged: undefined},
           },
         });
         const hostileCreep = mockInstanceOf<Creep>();
         const tower = mockStructure(STRUCTURE_TOWER, {
           attack: jest.fn(() => OK),
           room: {
             name: 'W1N1',
             find: (type: FindConstant): Creep[] | null => {
               return type === FIND_HOSTILE_CREEPS ? [hostileCreep] : null;
             },
           },
         });
         towerB.run(tower);
         expect(tower.attack).toHaveBeenCalledWith(hostileCreep);
       });
  });
});
