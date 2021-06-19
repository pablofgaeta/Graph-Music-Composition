# Graph-Music-Composition
Utilizes directed graph traversals (and other graph theory) to present a visual algorithmic approach to composition.
All graphics are drawn in Vanilla JS using basic rendering on a Canvas Element

## How To Use
### Creation commands
* Create node                : <kbd>cmd</kbd> + <kbd>click</kbd>
* Create edge                : <kbd>alt</kbd> (hold) + click and drag from one node to another
### Selection commands
* Move (single or multi-select) : <kbd>click</kbd> (over a node) + drag mouse
* Toggle node/edge selection    : <kbd>shift</kbd> + click (over a node)
* Multi-select                  : <kbd>click</kbd> (NOT over a node) + drag over desired nodes/edges
### Edit modes
* Change samples :
  - While nodes are selected, press any number <kbd>1</kbd>-<kbd>9</kbd> to choose the first 9 samples 
  - Otherwise, clicking on "samples/${file}" assigns the sample to all selected nodes
* Change edge delay : Select edge and edit the scaling factor on the "Selected Edges" sidebar
* Delete selected nodes/edges with <kbd>delete</kbd> / <kbd>backspace</kbd> 
### Play modes 
* Trigger selected nodes : <kbd>x</kbd>
  - Triggering a node causes automatic traversal of the directed graph starting at each currently selected node
* Kill graph traversal : <kbd>k</kbd>
  - Prevents further traversal for any nodes

## Files
* VisualGraph.js   : Defines a GraphObj and its child class, VisualGraph, which implements HTMLCanvas visualization of a Graph data structure
* GCM_Audio.js     : Audio engine for individual instruments (synth and sampler). Note: AudioFileManager is a singleton storing imported audio.
* GCM_Graph.js     : Combines graph visualization and audio components to create a graph with instrument nodes and delay edges
* GCM_Interface.js : Register graphics calls and user event handling
* index.html       : Defines menu options to assist in application state

## PLANS
* ✅ : Graph/Node classes
* ✅ : Design Graph Visualization (baseline)
* ✅ : Graph traversal algorithms (baseline)
* ✅ : Timed traversal events
* ✅ : GCMSampler and GCMSynth
* ✅ : UI display of current loaded samples and editing mode states
* ✅ : Node of GCMSampler displays current filename registered
* ✅ : Change GCMSampler sample by indexing (by keypress 1-9) the currently loaded files (this will likely change for a more universal strategy to incorporate >9 samples)
* ✅ : Associate each node (single voice) with registered instrument
* User-loaded samples
* Design synthesizers
    - [Synth vs. sample]
    - Synth FX : timbre/adsr/effects/FM or AM Algorithms
    - Sample FX : playback rate/effects
    - Dynamic FX over time or algorithmically for an instrument
* Node frequency control
  - relative
  - just-tuned
  - sample playback manipulation
* Additional node types:
  - Probabilistic trigger
  - Symbolic trigger
  - Conditional trigger 
  - Time To Live state
  - Breakpoint state
* Graph abstractions

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

