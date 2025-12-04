import type { ModelConfig } from "./models";
import type { ScoreResult } from "./scoring";

// Game result for a single model
export interface ModelResult {
  model: ModelConfig;
  guessCoordinate: string | null;
  guessHex: string | null;
  reasoning: string | null;
  score: number;
  zone: ScoreResult["zone"] | null;
  gridDistance: number | null;
  error: string | null;
  responseTime: number;
  rank?: number;
}

// Full game state
export interface GameState {
  clue: string;
  targetCoordinate: string;
  targetHex: string;
  results: ModelResult[];
  totalTime: number;
  clueGiverScore: number;
}

