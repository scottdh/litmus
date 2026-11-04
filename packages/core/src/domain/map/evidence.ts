export type Severity = 'cosmetic' | 'minor' | 'major';

export interface HeuristicViolation {
  heuristic: string;
  severity: Severity;
}

export type Evidence =
  | { kind: 'heuristic-review'; violations: HeuristicViolation[] }
  | { kind: 'quote'; text: string; source: string }
  | { kind: 'clip'; url: string }
  | { kind: 'metric'; name: string; value: string };
