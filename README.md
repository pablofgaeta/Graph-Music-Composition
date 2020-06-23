# Graph-Music-Composition
Utilizes directed graph traversals (and other graph theory) to present a visual algorithmic approach to composition.
All graphics are drawn in Vanilla JS using basic rendering on a Canvas Element

## How To Use
* A section is started by triggering a node, the rest is automatic through graph traversal

## Files
* Graph.js
* GraphCompositionInterface.js : Graphics and user event handling singleton
* Audio.js                     : Audio engine for individual instruments 

## PLANS
* ✅ - Graph/Node classes
* ✅ (mostly) - Design Graph Visualization
* Graph traversal algorithms
* Timed traversal events
* Design each instrument with dat.gui
    - [Synth vs. sample]
    - Synth FX : timbre/adsr/effects/FM or AM Algorithms
    - Sample FX : playback rate/effects
    - Dynamic FX over time or algorithmically for an instrument
* Associate each node (single voice) with registered instrument
* Node frequency control 
  - relative
  - just-tuned
  - sample playback manipulation
* Symbolic triggers for separate connected components
    - This would help keep sections brief and discrete while still being able to communicate

## Nodes
* Associated with a specific synth or instrument
or
* Symbolic trigger to a different node
## Connected Components
* Discrete sections of composition
* Symbolic triggers can connect different sections
## Edges
* Represent a dependence relationship between nodes
* This relationship may be a delayed play signal or effect chain.
## Cycles
* Once entered, creates an infinite loop that must be manually paused
* Combined with a delay, a graph cycle can mimic a traditional looping mechanism

