# Energy Transport Networks (Intra-Room)

Throughout the game, it is critically important to be able to efficiently move energy throughout a room to supply various operations.

Later in the game, you get `Links` which simplify this a bit because you no longer need to run creeps between link locations.

However, without `Links` and even after they become available there will still be plenty of temporary/inconvenient locations where energy needs to be moved.

This network will manage building all of the roads between persistant locations in the room.

## The Network

The (Intra-room) Energy Network is a control system for devising where and how energy should be moved around the room.

It does this by analyzing the room and compling a list of Energy Source nodes, and Energy Sink nodes.

Energy Source nodes are registered by various operations and missions. For example, a Harvesting mission will register its `Container` or `Link` as an Energy Source, while a Upgrade mission will register its `Container` or `Link` as an Energy Sink.

All Nodes will have a priority, which the network uses to decide which Source / Sinks to satisfy first.

*NOTE*: For now, we will ignore the posibility of importing/exporting energy between rooms.

### Energy Source Node

An Energy Source Node is anything which is expected to contain an excess of energy. This could be a `Container`, `Link`, `Storage`, `Terminal`, Idle `Creep` dropzone.

The network controller will look at these source and attempt to assign transport missions to bring their excess to a sink.

### Energy Sink Node

An Energy Sink Node is anything which requires energy. This could also be a `Container`, `Link`, `Storage`, `Terminal`, Idle `Creep` dropzone.

The network controller will decide which of these sinks to move energy, and how it should be moved.

## Network Edge Types

There are a few possible edges the network can use to flow energy between nodes.

### Link Edge

Link Edges can be used to transfer energy from one `Link` to another `Link`.

*NOTE*: For now I will ignore Link Edges until I have access to Links.

### Walk Edge

Represents a Transport Mission where creeps will walk back and forth from the source to the target.

This is the most simple edge type. It is often ephemeral, and will be removed when the Source/Sink is removed.

### Highway Edge

Represents a Edge which will include a Build, Pave, and Transport mission.

The edge will pick a path from the Source to the Sink, and build a Road between the two points. It will manage the Build Mission to construct the road along the path, and then maintain two Missions to repave the road from time to time, and run Hauler creeps along the highway.

If a road segment is destroyed, the Highway Edge will restart the Build mission to replace it.

This edge type is only used if both the Source and Sink are labeled as `Persistant`.
