# Graph-Music-Composition
Utilizes directed graph traversals (and other graph theory) to present a visual algorithmic approach to composition.
All graphics are drawn in Vanilla JS using basic rendering on a Canvas Element

## How To Use
### Creation commands
* Create node                : <kbd>cmd</kbd> + <kbd>click</kbd>
* Create edge                : <kbd>shift</kbd> (hold) + click and drag from one node to another
* Create instrument          : <kbd>cmd</kbd> + <kbd>i</kbd> (edit in dat.GUI window 'INSTRUMENT EDITOR')
### Selection commands
* Move (single or multi-select) : <kbd>click</kbd> (over a node) + drag mouse
* Toggle node/edge selection    : <kbd>option</kbd> + click (over a node)
* Multi-select                  : <kbd>click</kbd> (NOT over a node) + drag over desired nodes/edges
  - Delete selected             : <kbd>delete</kbd> / <kbd>backspace</kbd> 
### Edit modes
* Edit node voice       : <kbd>e</kbd> (while a node is selected)
* Toggle dat.GUI window : <kbd>h</kbd>
* Edit instrument       : the 'INSTRUMENT EDITOR' in the GUI window at the top right contains parameters to control each created instrument
### Play modes 
* Trigger selected nodes : <kbd>x</kbd>
  - Triggering a node causes automatic traversal of the directed graph
  - A symbolic trigger can be created to trigger multiple sections instantaneously with a single click

## Files
* Graph.js
* GraphCompositionInterface.js : Graphics and user event handling singleton
* Audio.js                     : Audio engine for individual instruments 

## PLANS
* ✅ : Graph/Node classes
* ✅ : Design Graph Visualization (mostly)
* ✅ : Graph traversal algorithms (until more complex ones)
* ✅ : Timed traversal events
* Design each instrument with dat.gui
    - [Synth vs. sample]
    - Synth FX : timbre/adsr/effects/FM or AM Algorithms
    - Sample FX : playback rate/effects
    - Dynamic FX over time or algorithmically for an instrument
* ✅ : Associate each node (single voice) with registered instrument
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

