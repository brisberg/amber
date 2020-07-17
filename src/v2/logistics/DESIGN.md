# Logistics Network

Freeform thoughts on how to design the Logistics Network.

### Creep Level:
At the Creep level, creeps will be given a few basic behaviors such as `Drop`, `Retrieve`, and `Deliver`.

These will simply move to the given target, and transfer the desired resources.

### Mission Level:
They will be directed by a `TransportMsn`. This Mission will handle requesting new creeps to maintain enough to handle current demand. Each Tick it will evaluate the first step in the RoutePlan the creep has assigned, and assign a behavior based on that.

Note: It might be nice to give each Step in the plan a unique id (increasing numerical sequence for each plan). Transport Mission can simply check this id to avoid reassigning creep behaviors.

### Network Level:
The `Network` is a subsystem entity that handle the decision making of which creeps should be given which requests.
It will be accessible on the global scope similar to SpawnQueues. (e.g `global.LNetworks[roomName]`)

It will spawn a TransportMsn to contain the creeps.

Logistics requests can be registered to the Network itself. Each time a new request is registered, the network will evaulate the creeps it has at hand and compare their expected EndStates. It will do a path check from the Plan End position to the target of the request, and add that distance to the time.

The creep which can get there soonest will be assigned, and it will use w/e free carry capacity it has at the time. If this capacity isn't enough to fulfil the request. The request is also assigned to the next closest, and so on.

The algorithm should take into account resource changes overtime, and local capacity constraints.
