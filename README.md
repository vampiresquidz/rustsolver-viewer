# RustSolverViewer

A single HTML file that opens a solved poker spot in a browser. No build step,
no server, no install — download `index.html`, open it, drop a `.hdv` file on it.

It reads `.hdv` files exported by [RustSolver](#about-the-solver), a Rust poker
solver for hold'em and Omaha. The solver itself is not in this repository; the
viewer is, so a solve can be handed to someone who does not have the solver.

## Using it

1. Save `index.html` anywhere.
2. Open it in any modern browser.
3. Drag a `.hdv` onto the page, or use the file picker.

Everything happens locally. The page makes no network requests and the file you
open never leaves your machine.

## What it shows

**The tree.** Every decision, chance and terminal node, with the line that
reaches it. Click through streets; the breadcrumb tracks where you are.

**A strategy grid.** For hold'em, the usual 13×13: pairs down the diagonal,
suited above, offsuit below, each square painted by its action mix.

**A PLO double matrix.** Four-card hands do not fit in a 13×13, so a PLO
preflop node draws the top two ranks as a 13×13 and opens the square you click
into a second 13×13 of the two cards underneath. Three ways to split it:

| Split | What a square means |
|---|---|
| Double-suited | `AKds` and `AKs` and `AK` are three different squares |
| Suited | `AKs` and `AK` are separate; double-suited folds into suited |
| Merged | ranks only — the smallest grid, the coarsest read |

Suitedness is a property of the hand, not of which of the two cards the sort
happened to pick first, so `AsKhKs2c` keys as suited at the top level.

> PLO **postflop** has no matrix, and the viewer says so rather than drawing an
> empty one. Omaha postflop is solved in made-hand buckets (trips, two pair, a
> pair plus a draw), so those nodes hold no four-card hands to key a square on.
> That is a property of the solver, not of the viewer. Use the hand list.

**A hand table.** Per-hand frequencies, EV, reach and combos, sortable, with a
filter box.

**Views.** Strategy, EV, and EV difference against the best action.

## Checking it

`check-plo-keying.mjs` asserts that this viewer puts a PLO hand in the same
square the desktop app does.

```sh
node check-plo-keying.mjs
```

The matrix is written twice — once in Rust, once in the JavaScript inside
`index.html` — because the viewer is one file with no build step and the desktop
app cannot ship a browser. Two implementations drift, and a drift here is nearly
invisible: both charts look correct, they just disagree about which square a
hand belongs in. So the script reads the real keying functions out of
`index.html` rather than a copy of them, and checks 11 hands across 6 split and
level combinations plus 7 square labels against the same fixture the Rust test
pins.

## The `.hdv` format

JSON, one object, version 1. Abridged:

```json
{
  "format": "hdv", "version": 1, "title": "SRP BTN vs BB 100bb Ah Kd 7c",
  "game": { "variant": "Holdem", "seats": 2, "positions": ["BTN", "BB"],
            "bb": 2.0, "structure": "NoLimit", "start_street": "Flop" },
  "board": ["Ah", "Kd", "7c"],
  "stacks": [200, 200], "pot": 20,
  "meta": { "iterations": 1200, "exploit_pct_pot": 0.4, "engine": "vector-cfr" },
  "root": 0,
  "hands": [["AhKh", "AhKd"], ["..."]],
  "nodes": [
    { "id": 0, "type": "decision", "player": 0, "street": "Flop", "pot": 20,
      "actions": [ {"name": "Check", "amount": 0, "child": 1},
                   {"name": "Bet 6.6", "amount": 6.6, "pct_pot": 33, "child": 7} ],
      "hand_ids": [0, 1],
      "freqs": [[1000, 0], [640, 360]],
      "evs":   [[12.1, 11.9]],
      "ev": [12.1], "reach": [1.0], "combos": [1] },
    { "id": 1, "type": "chance", "street": "Turn", "children": {"2c": 12} },
    { "id": 9, "type": "terminal", "kind": "fold", "pot": 26.6 }
  ]
}
```

`freqs` are per-mille, per hand, per action. `hand_ids` index into
`hands[player]`. A chance node's `children` may be partial — only the cards that
were exported. `board2` carries the second board of a double-board game.

Anything that writes this shape can use the viewer.

## About the solver

RustSolver is a Rust poker solver: hold'em, short deck, PLO4/5/6, PLO8 and Big O,
no-limit / pot-limit / fixed-limit, 2–9 seats, with node locking, ICM and bounty
models, resumable solves, and an EV-loss trainer. It is a separate, closed
project. This repository is only its viewer.

`video/digitalocean-api-key.mp4` is the walkthrough from the desktop app's help
— how to create a DigitalOcean API key so the app can rent a server for a solve
too large for the machine in front of you. It is included here because it is a
standalone guide and the credits for its sound design belong somewhere public.
The token on screen is covered by a burned-in redaction in every frame it
appears. See `video/CREDITS.md` for the presenter and the CC0 sound sources.

## Licence

MIT. See `LICENSE`.
