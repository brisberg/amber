# Integration Testing

Integration tests are built on running a fullScreepsServer. The tests can modify the game world,and runthe AI over many ticks to see how it performsinvarious scenarios.


### Thinking outloud:

These integration tests should be as broad andflexible as possible, with as
little AI specific setup as possible.

```
Idealy, it would  be something like:
  Spawn a container full of energy somewhere
  Spawn a handful of potentially useful creeps
  Drop an Upgrade Operation Flag on the Controller
  Run ticks until Controller level === 2
    Pass
    Fail after 500? ticks
```

This will require some redesign of the AI systems tobe more modular. As it
stands, most operations depend on the logisticssystem, spawn system, and
distribution system working.

The unit tests will handle small things like spawning new creeps, specifically placing structures, etc.
The integration tests should check "Can we complete a broad task in X ticks".

We should have a long integration test for Bootstrap

### Possible Tests:

- Bootstrap - Run the colony from zero to RCL4 (with some cost reductions)
- Mining Operation - Given a Source and a Spawn, set up static container mining
- Mining Operation (Link) - Given a Container miner, upgrade to Link Mining
- Upgrade Operation - Given a Controller and a source of energy, set up container and start upgrading.
- Upgrade Operation (Link) - Given a Controller and a source of energy, set up Link and Upgrade Controller
- Distribute Spawn Energy - Given a spawn, a set of extensions, and a Distributor, see how long it takes to distribute to all
- Base Planning - Given some rooms, see how we do a base planning
- Scouting - TBD
- Labs - TBD
- Tower Defence against Invaders
- Tower Defense against Drainers
- Tower Defense against Wreckers
- Nuke Defense
- Power Bank Raid
- Caravan Raid
- Drain Attack
- Wrecker Attack
- Colonization
- Remote Mining Setup
- SK Farming
