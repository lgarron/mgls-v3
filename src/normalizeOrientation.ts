// This is a vendored copy of
// https://github.com/cubing/cubing.js/blob/0af6bf5febd877b07d7d1de81cf167e98c7d0bbc/src/protocol/binary/binary3x3x3.ts#L1:L129
// TODO: expose this in `cubing.js` directly.

import { parse, Sequence } from "cubing/alg";
import {
  Combine,
  Invert,
  KPuzzle,
  Puzzles,
  Transformation,
} from "cubing/kpuzzle";

function puzzleOrientationIdx(state: Transformation): [number, number] {
  const idxU = state["CENTERS"].permutation[0];
  const idxD = state["CENTERS"].permutation[5];
  const unadjustedIdxL = state["CENTERS"].permutation[1];
  let idxL = unadjustedIdxL;
  if (idxU < unadjustedIdxL) {
    idxL--;
  }
  if (idxD < unadjustedIdxL) {
    idxL--;
  }
  return [idxU, idxL];
}

const puzzleOrientationCache: Transformation[][] = new Array(6)
  .fill(0)
  .map(() => {
    return new Array(6);
  });

// We use a new block to avoid keeping a reference to temporary vars.
{
  const orientationKpuzzle = new KPuzzle(Puzzles["3x3x3"]);
  const uAlgs: Sequence[] = ["", "z", "x", "z'", "x'", "x2"].map((s) =>
    parse(s)
  );
  const yAlg = parse("y");
  for (const uAlg of uAlgs) {
    orientationKpuzzle.reset();
    orientationKpuzzle.applyAlg(uAlg);
    for (let i = 0; i < 4; i++) {
      orientationKpuzzle.applyAlg(yAlg);
      const [idxU, idxL] = puzzleOrientationIdx(orientationKpuzzle.state);
      puzzleOrientationCache[idxU][idxL] = Invert(
        Puzzles["3x3x3"],
        orientationKpuzzle.state
      );
    }
  }
}

export function normalizePuzzleOrientation(s: Transformation): Transformation {
  const [idxU, idxL] = puzzleOrientationIdx(s);
  const orientationTransformation = puzzleOrientationCache[idxU][idxL];
  return Combine(Puzzles["3x3x3"], s, orientationTransformation);
}
