import Network from './network';
import {Request} from './request';
import {RoutePlan, RoutePlanStep} from './route-plan';

export {Network, Request, RoutePlan, RoutePlanStep};

/**
* Constructs a Logistics Network from the name.
*/
export function constructNetworkFromName(
   type: string, name: string): Network|null {
 return new Network(name);
}
