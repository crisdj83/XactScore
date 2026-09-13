export type ContestScoring = {
  exact: number;
  close: number;
  result: number;
};

export const PREDICTION_LOCK_MS = 60 * 60 * 1000;
export const PREDICTION_REVEAL_MS = 30 * 60 * 1000;

export const DEFAULT_SCORING: ContestScoring = {
  exact: 3,
  close: 1.5,
  result: 1,
};

export function resolveContestScoring(contest?: {
  points_exact?: number | null;
  points_close?: number | null;
  points_result?: number | null;
  scoring?: ContestScoring | null;
} | null): ContestScoring {
  if (contest?.scoring) return contest.scoring;
  return {
    exact: Number(contest?.points_exact) || DEFAULT_SCORING.exact,
    close: Number(contest?.points_close) || DEFAULT_SCORING.close,
    result: Number(contest?.points_result) || DEFAULT_SCORING.result,
  };
}

export function isPredictionLocked(utcDate: string, now = Date.now()): boolean {
  const kickoff = new Date(utcDate).getTime();
  return !Number.isFinite(kickoff) || now >= kickoff - PREDICTION_LOCK_MS;
}

export function isPredictionRevealable(utcDate: string, now = Date.now()): boolean {
  const kickoff = new Date(utcDate).getTime();
  return Number.isFinite(kickoff) && now >= kickoff - PREDICTION_REVEAL_MS;
}

export function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  scoring: ContestScoring = DEFAULT_SCORING
) {
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return { points: scoring.exact, isExact: true, isClose: false, isCorrect: true };
  }
  const predOutcome =
    predictedHome > predictedAway ? 'H' : predictedHome < predictedAway ? 'A' : 'D';
  const actualOutcome = actualHome > actualAway ? 'H' : actualHome < actualAway ? 'A' : 'D';
  const isCorrect = predOutcome === actualOutcome;
  const totalDiff = Math.abs(actualHome + actualAway - (predictedHome + predictedAway));
  const isClose = isCorrect && totalDiff <= 1;
  if (isClose) return { points: scoring.close, isExact: false, isClose: true, isCorrect: true };
  if (isCorrect) return { points: scoring.result, isExact: false, isClose: false, isCorrect: true };
  return { points: 0, isExact: false, isClose: false, isCorrect: false };
}
