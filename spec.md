# ElectroLearn

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Homepage with dramatic title related to lightning and electrostatics, and motivational/scientific quotes
- Navigation bar linking to all sections
- Interactive Coulomb's Law simulator: drag two charges, see force vectors and magnitude update in real time
- Interactive Electric Field Lines visualizer: place positive/negative charges on a canvas, see field lines drawn dynamically
- Interactive Lightning Formation demo: animated canvas showing charge separation in clouds and lightning strike
- Static Electricity / Charge Transfer section with interactive sparks simulation
- "About / Created By" section with creator credits:
  - PALLELA HARSHITH REDDY - 25BEC073
  - AAVULA KARTHIKESH - 25BEC002
  - RAJ VARDHAN - 25BEC101
- Footer with project info

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: minimal Motoko actor (no persistent data needed, site is frontend-driven)
2. Frontend pages/sections:
   - Home: hero section with title, subtitle, quotes carousel/list
   - Coulomb's Law: interactive two-charge canvas simulation
   - Electric Fields: multi-charge field line canvas simulation
   - Lightning: animated cloud charge separation and strike canvas
   - Static Electricity: spark/charge transfer interactive canvas
   - About: creator credits cards
3. Navigation: sticky nav bar linking to all sections (single-page scroll or multi-page routes)
4. Canvas simulations using HTML5 Canvas API with requestAnimationFrame
5. Responsive layout for desktop and mobile
