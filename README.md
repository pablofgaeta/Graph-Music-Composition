# Graph-Music-Composition
Uses a directed graph approach to music composition

Nodes
* Represent a frequency (and other specifications to be added)
Connected Components
* Represent an instrument voice -- i.e. timbre, effects, adsr
Edges
* Represent a dependence relationship between nodes
* This relationship may be a delayed play signal or effect chain.
Cycles
* Combined with a delay, a graph cycle can mimic a traditional looping mechanism
