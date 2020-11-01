import {
  algToString,
  BareBlockMove,
  invert,
  parse,
  Sequence,
} from "cubing/alg";
import {
  Combine,
  Invert,
  KPuzzle,
  Puzzles,
  SVG,
  Transformation,
} from "cubing/kpuzzle";
import {
  experimentalSetShareAllNewRenderers,
  TwistyPlayer,
} from "cubing/twisty";
import { planCLSSVGString } from "./3x3x3-plan-cls";
import { clsAlgs } from "./cls-algs";
import { normalizePuzzleOrientation } from "./normalizeOrientation";

experimentalSetShareAllNewRenderers(true);

const def = Puzzles["3x3x3"];
const coInverse = [0, 2, 1];

// Orientations of URF, UBR, ULB, UFL, concatenated into a string for lookup.
const drfPlacedCases = {
  "2000": "I0",
  "0022": "I1",
  "0202": "I2",
  "2021": "I3",
  "0122": "I4",
  "0221": "I5",
  "2111": "I6",
  "2222": "I7",
  "1000": "Im0",
  "0110": "Im1",
  "0101": "Im2",
  "1210": "Im3",
  "0112": "Im4",
  "0211": "Im5",
  "1222": "Im6",
  "1111": "Im7",
  "0000": "C0",
  "2220": "C1",
  "1011": "C2",
  "2121": "C3",
  "1020": "C4",
  "0210": "C5",
  "0120": "C6",
  "2211": "C7",
};

// TODO: Expose this in `cubing.js` directly.
const pieceNames: Record<string, string[]> = {
  EDGES: "UF UR UB UL DF DR DB DL FR FL BR BL".split(" "),
  CORNERS: "UFR URB UBL ULF DRF DFL DLB DBR".split(" "),
  CENTERS: "ULFRBD".split(""),
};

// TODO: Use piece names?
function checkIsCLS(state: Transformation): [result: boolean, reason: string] {
  for (let mIdx = 0; mIdx < 6; mIdx++) {
    if (state["CENTERS"].permutation[mIdx] !== mIdx) {
      return [false, `${pieceNames["CENTERS"][mIdx]} center is misplaced`];
    }
  }
  for (let eIdx = 0; eIdx < 12; eIdx++) {
    if (eIdx >= 4 && state["EDGES"].permutation[eIdx] !== eIdx) {
      return [false, `${pieceNames["EDGES"][eIdx]} edge is misplaced`];
    }
    if (state["EDGES"].orientation[eIdx] != 0) {
      return [false, `${pieceNames["EDGES"][eIdx]} edge is misoriented`];
    }
  }
  for (let cIdx = 5; cIdx < 8; cIdx++) {
    if (state["CORNERS"].permutation[cIdx] !== cIdx) {
      return [false, `${pieceNames["CORNERS"][cIdx]} corner is misplaced`];
    }
    if (state["CORNERS"].orientation[cIdx] != 0) {
      return [false, `${pieceNames["CORNERS"][cIdx]} corner is misoriented`];
    }
  }
  return [true, ""];
}

function preNormalize(nonNormOriState: Transformation): Transformation {
  const inverseNonNormOriState = Invert(def, nonNormOriState);
  const inverseState = normalizePuzzleOrientation(inverseNonNormOriState);
  return Invert(def, inverseState);
}

// Assumes that the input is a 3x3x3 state that represents a valid CLS case (up
// to AUF).
// TODO: handle centers
function clsCaseName(nonNormOriState: Transformation): string {
  // TODO: return y adjustment.
  const state = preNormalize(nonNormOriState);

  const [isCLS, reason] = checkIsCLS(state);
  if (!isCLS) {
    console.log(reason);
    return "";
  }
  const kpuzzle = new KPuzzle(def);
  kpuzzle.state = Combine(def, kpuzzle.state, state);
  const idxDRF = state["CORNERS"].permutation.indexOf(4);
  // console.log({ idxDRF });
  if (idxDRF === 4) {
    let lookup = state["CORNERS"].orientation.slice(0, 4).join("");
    for (let aufAmount = 0; aufAmount < 4; aufAmount++) {
      const caseName = drfPlacedCases[lookup];
      if (caseName) {
        return caseName;
      }
      lookup = lookup.slice(1) + lookup[0];
    }
  } else {
    let aufAmount = idxDRF;
    if (aufAmount === 3) {
      aufAmount = -1; // TODO: find a cleaner way to calculate this.
    }
    const aufMove = BareBlockMove("U", aufAmount);
    kpuzzle.applyBlockMove(aufMove);
    // console.log({ aufAmount });
    const ori = kpuzzle.state["CORNERS"].orientation;
    const drfOri = ori[0];
    // console.log({ drfOri });
    let subsetPrefix: string;
    let coShapeIdx: number;
    switch (drfOri) {
      case 0:
        subsetPrefix = "O";
        coShapeIdx = ori[1] + 3 * ori[2] + 9 * ori[3];
        break;
      case 1:
        subsetPrefix = "+";
        coShapeIdx =
          9 * coInverse[ori[1]] + 3 * coInverse[ori[2]] + coInverse[ori[3]];
        break;
      case 2:
        subsetPrefix = "-";
        coShapeIdx = ori[1] + 3 * ori[2] + 9 * ori[3];
        break;
    }
    return `${subsetPrefix}${coShapeIdx}`;
  }
}

function clsCaseNameForAlg(alg: Sequence): string {
  const kpuzzle = new KPuzzle(def);
  kpuzzle.applyAlg(invert(alg));
  return clsCaseName(kpuzzle.state);
}

const cases: Record<string, string[][]> = {};
for (const algInfo of clsAlgs) {
  const parsed = parse(algInfo[1]);
  // console.log(algInfo[1]);
  const caseName = clsCaseNameForAlg(parsed);
  cases[caseName] = cases[caseName] ?? [];
  cases[caseName].push(algInfo);
  // console.log(caseName, alg);
}

const defCLS = Puzzles["3x3x3LL"];
defCLS.svg = planCLSSVGString; // TODO: upstream stickerings

const twistyPlayer = document.querySelector("twisty-player") as TwistyPlayer;
twistyPlayer.timeline.tempoScale = 2.5;
function setAlg(alg: Sequence) {
  twistyPlayer.timeline.pause(); // TODO: Should TwistyPlayer do this automatically?
  twistyPlayer.alg = alg;
  twistyPlayer.experimentalStartSetup = invert(alg);
  twistyPlayer.timeline.jumpToStart();
}

(async () => {
  const table = document
    .querySelector("#cases")
    .appendChild(document.createElement("table"));
  for (const [name, algs] of Object.entries(cases)) {
    const tr = table.appendChild(document.createElement("tr"));

    const nameTD = tr.appendChild(document.createElement("td"));
    nameTD.textContent = name;
    nameTD.rowSpan = algs.length;

    const svg = new SVG(defCLS);
    const kpuzzle = new KPuzzle(defCLS);
    kpuzzle.applyAlg(invert(parse(algs[0][1])));
    svg.draw(defCLS, preNormalize(kpuzzle.state));
    const imageTD = tr.appendChild(document.createElement("td"));
    imageTD.appendChild(svg.element);
    imageTD.rowSpan = algs.length;

    let firstRow = true;
    for (const algInfo of algs) {
      const algTr = firstRow
        ? tr
        : table.appendChild(document.createElement("tr"));
      const td = algTr.appendChild(document.createElement("td"));
      const a = td.appendChild(document.createElement("a"));
      const parsed = parse(algInfo[1]);
      a.textContent = algToString(parsed);
      a.href = `#${algToString(parsed)}`;
      a.addEventListener("click", (e) => {
        setAlg(parsed);
        // e.preventDefault();
      });
      algTr.appendChild(document.createElement("td")).textContent = algInfo[2]; // stars
      algTr.appendChild(document.createElement("td")).textContent = algInfo[3]; // comments
      firstRow = false;
    }
    // await new Promise((resolve) => {
    //   setTimeout(resolve, 0);
    // });
  }
  twistyPlayer.classList.remove("loading");
})();
