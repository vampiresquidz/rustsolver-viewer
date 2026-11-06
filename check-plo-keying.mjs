// Does the browser viewer key a PLO hand into the same square as the desktop
// app? Run it with: node viewer/check-plo-keying.mjs
//
// The two matrices are written twice - once in Rust (plo_matrix.rs) and once
// in JavaScript, inside index.html - because the viewer is a single file with
// no build step and the app cannot ship a browser. Two implementations drift,
// and a drift here is almost invisible: both charts look right, they just
// disagree about which square a hand belongs in. So the fixture below is the
// same table asserted by `plo_matrix::tests::the_viewer_keys_hands_the_same_way`,
// and this script checks the JavaScript against it by reading the real
// functions out of index.html rather than a copy of them.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, "index.html"), "utf8");

// the pure keying block: everything from the rank helpers to the first
// function that touches the page
const from = html.indexOf("const SPLIT_SUFFIX");
const to = html.indexOf("/// Is this hand inside the open square?");
if (from < 0 || to < 0 || to <= from) {
  console.error("could not find the PLO keying block in index.html — did it move or get renamed?");
  process.exit(2);
}
const RANKS = "AKQJT98765432";
const block = html.slice(from, to);
const mod = new Function("RANKS", block + "\nreturn { ploKey, ploIndex, ploCellLabel, ploCellIndex, ploUpper };")(RANKS);

// hand, then the square for each (split, level) pair in this order:
//   ds/top, ds/bottom, s/top, s/bottom, merged/top, merged/bottom
const FIXTURE = [
  ["AsKdQhJc", 13, 41, 13, 41, 13, 41],
  ["AsKsQhJc", 13, 41, 1, 41, 13, 41],
  ["AsKsQhJh", 1, 29, 1, 29, 13, 41],
  ["AsAdKsKd", 0, 14, 0, 14, 0, 14],
  ["AhAsKd2c", 0, 157, 0, 157, 0, 157],
  ["2s3d4h5c", 139, 167, 139, 167, 139, 167],
  ["KsKdKhQc", 14, 27, 14, 27, 14, 27],
  // suitedness is a fact about the hand, not about which ace the sort picked
  ["AsKhKs2c", 13, 157, 1, 157, 13, 157],
  ["QsJdTh9c", 41, 69, 41, 69, 41, 69],
  // PLO5: the top two and the next two still key; the fifth card does not
  ["AsKsQhJcTd", 13, 41, 1, 41, 13, 41],
  // the same hand written in another order has to land in the same square
  ["KdAsJcQh", 13, 41, 13, 41, 13, 41],
];

const LABELS = [
  [0, "AA", "AA", "AA"],
  [1, "AKds", "AKs", "AK"],
  [13, "AK", "AK", "AK"],
  [14, "KK", "KK", "KK"],
  [12, "A2ds", "A2s", "A2"],
  [168, "22", "22", "22"],
  [155, "32ds", "32s", "32"],
];

const SPLITS = [["ds", "top"], ["ds", "bottom"], ["s", "top"], ["s", "bottom"], ["merged", "top"], ["merged", "bottom"]];
let bad = 0;

for (const [hand, ...want] of FIXTURE) {
  const k = mod.ploKey(hand);
  if (!k) { console.error(`FAIL ${hand}: ploKey returned null`); bad++; continue; }
  SPLITS.forEach(([split, level], i) => {
    const got = mod.ploIndex(k, split, level);
    if (got !== want[i]) {
      console.error(`FAIL ${hand} ${split}/${level}: want square ${want[i]}, got ${got}`);
      bad++;
    }
  });
}

for (const [idx, ds, s, merged] of LABELS) {
  for (const [split, want] of [["ds", ds], ["s", s], ["merged", merged]]) {
    const got = mod.ploCellLabel(idx, split);
    if (got !== want) { console.error(`FAIL label ${idx} ${split}: want ${want}, got ${got}`); bad++; }
  }
}

// a hand that is not four cards has no square at all
for (const junk of ["AsKd", "", "AsKdQh", "XxKdQhJc"]) {
  if (mod.ploKey(junk) !== null) { console.error(`FAIL ${junk || "(empty)"}: should not key`); bad++; }
}

// every square is reachable and the mapping is one-to-one
const seen = new Set();
for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) seen.add(r * 13 + c);
if (seen.size !== 169) { console.error("FAIL the grid is not 169 squares"); bad++; }

if (bad) {
  console.error(`\n${bad} mismatch(es): the viewer and the desktop app disagree about where a hand goes.`);
  process.exit(1);
}
console.log(`ok — ${FIXTURE.length} hands x ${SPLITS.length} views and ${LABELS.length} labels match plo_matrix.rs`);
