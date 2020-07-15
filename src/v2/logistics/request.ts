export interface Request {
  id: number;
  resource: RESOURCE_ENERGY;  // TODO: Other Resources
  request: 'pickup'|'delivery';
  type: 'resource'|'creep'|'structure';
  targetId: Id<RoomObject>;  // Target containing the resource or capacity
  total?: number;
  amount: number;  // Amount of Resources requested
  buffer: number;  // Buffer size of the container RoomObject
  delta: number;   // Amount of esimated buffered Resource change per tick
  // Request will remain even if amount is reduced to zero
  persistent?: boolean;
  timeout: number;  // Game tick when this request is no longer valid
}
