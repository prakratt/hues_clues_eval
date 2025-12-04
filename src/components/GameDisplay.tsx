"use client";

import { useState, useCallback } from "react";
import { MODELS, ModelConfig } from "@/lib/models";
import ColorBoard from "./ColorBoard";

interface GuessData {
  modelId: string;
  modelColor: string;
  coordinate: string | null;
  hex: string | null;
  reasoning: string | null;
  score: number;
  zone: string | null;
  error: string | null;
}

interface RoundData {
  round: number;
  clueGiver: ModelConfig;
  clue: string;
  targetCoordinate: string;
  targetHex: string;
  guesses: GuessData[];
  clueGiverPoints: number;
  showScoring: boolean;
}

const ROUND_OPTIONS = [4, 8, 12, 16, 20];

export default function GameDisplay() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(12);
  const [selectedRounds, setSelectedRounds] = useState(12);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [currentGuesses, setCurrentGuesses] = useState<GuessData[]>([]);
  const [showScoringGrid, setShowScoringGrid] = useState(false);
  const [isClueGiverThinking, setIsClueGiverThinking] = useState(false);
  const [tournamentComplete, setTournamentComplete] = useState(false);
  const [rankings, setRankings] = useState<{ model: ModelConfig; score: number }[]>([]);
  const [showRules, setShowRules] = useState(false);

  const startTournament = useCallback(async () => {
    setIsPlaying(true);
    setTournamentComplete(false);
    setCurrentRound(0);
    setScores({});
    setRoundData(null);
    setCurrentGuesses([]);
    setShowScoringGrid(false);
    setRankings([]);
    setTotalRounds(selectedRounds);

    try {
      const response = await fetch(`/api/game?rounds=${selectedRounds}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case "tournament_init":
                  setTotalRounds(data.totalRounds);
                  setScores(data.scores);
                  break;

                case "round_start":
                  setCurrentRound(data.round);
                  setCurrentGuesses([]);
                  setShowScoringGrid(false);
                  setRoundData({
                    round: data.round,
                    clueGiver: data.clueGiver,
                    clue: "",
                    targetCoordinate: data.targetCoordinate,
                    targetHex: data.targetHex,
                    guesses: [],
                    clueGiverPoints: 0,
                    showScoring: false,
                  });
                  break;

                case "clue_giver_thinking":
                  setIsClueGiverThinking(true);
                  break;

                case "clue_generated":
                  setIsClueGiverThinking(false);
                  setRoundData(prev => prev ? { ...prev, clue: data.clue } : null);
                  break;

                case "clue_error":
                  setIsClueGiverThinking(false);
                  setRoundData(prev => prev ? { ...prev, clue: `ERROR: ${data.error}` } : null);
                  break;

                case "guesser_thinking":
                  // Model is thinking (visual handled by board)
                  break;

                case "guess_placed":
                  setCurrentGuesses(prev => [...prev, {
                    modelId: data.guess.modelId,
                    modelColor: data.guess.modelColor,
                    coordinate: data.guess.coordinate,
                    hex: data.guess.hex,
                    reasoning: data.guess.reasoning,
                    score: 0,
                    zone: null,
                    error: data.guess.error,
                  }]);
                  break;

                case "reveal_scoring":
                  setShowScoringGrid(true);
                  break;

                case "round_complete":
                  setScores(data.scores);
                  setCurrentGuesses(data.guesses.map((g: any) => ({
                    modelId: g.model.id,
                    modelColor: g.model.color,
                    coordinate: g.guessCoordinate,
                    hex: g.guessHex,
                    reasoning: g.reasoning,
                    score: g.score,
                    zone: g.zone,
                    error: g.error,
                  })));
                  setRoundData(prev => prev ? {
                    ...prev,
                    guesses: data.guesses,
                    clueGiverPoints: data.clueGiverPoints,
                    showScoring: true,
                  } : null);
                  break;

                case "tournament_complete":
                  setTournamentComplete(true);
                  setRankings(data.rankings);
                  setScores(data.scores);
                  break;
              }
            } catch (e) {
              console.error("Parse error:", e);
            }
          }
        }
      }
    } catch (e) {
      console.error("Tournament error:", e);
    } finally {
      setIsPlaying(false);
    }
  }, [selectedRounds]);

  // Convert guesses to format ColorBoard expects
  const boardResults = currentGuesses
    .filter(g => g.coordinate)
    .map(g => ({
      model: MODELS.find(m => m.id === g.modelId)!,
      guessCoordinate: g.coordinate,
      guessHex: g.hex,
      reasoning: g.reasoning,
      score: g.score,
      zone: g.zone as any,
      gridDistance: null,
      error: g.error,
      responseTime: 0,
    }));

  // Sort models by score for leaderboard
  const sortedModels = [...MODELS].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Hues & Cues AI Tournament</h1>
            <p className="text-sm text-gray-500">
              {isPlaying ? `Round ${currentRound}/${totalRounds}` : `${selectedRounds} rounds • 4 AI models`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Rules Button */}
            <button
              onClick={() => setShowRules(true)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              📖 Rules
            </button>

            {/* Round Selector */}
            {!isPlaying && (
              <select
                value={selectedRounds}
                onChange={(e) => setSelectedRounds(Number(e.target.value))}
                className="px-3 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg"
              >
                {ROUND_OPTIONS.map(n => (
                  <option key={n} value={n}>{n} rounds</option>
                ))}
              </select>
            )}

            <button
              onClick={startTournament}
              disabled={isPlaying}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {isPlaying ? (
                <>
                  <div className="loading-spinner" />
                  <span>Round {currentRound}/{totalRounds}</span>
                </>
              ) : (
                <span>{currentRound > 0 ? "New Tournament" : "Start Tournament"}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-4">
        <div className="flex gap-6">
          {/* Leaderboard - Left Side */}
          <div className="w-64 shrink-0">
            <div className="card p-4 sticky top-24">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                🏆 Leaderboard
              </h3>
              <div className="space-y-2">
                {sortedModels.map((model, index) => (
                  <div
                    key={model.id}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                      index === 0 && scores[model.id] > 0
                        ? "bg-amber-50 ring-2 ring-amber-300"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg w-6">
                        {index === 0 && scores[model.id] > 0 ? "👑" : `#${index + 1}`}
                      </span>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: model.color }}
                      />
                      <span className="font-medium">{model.shortName}</span>
                    </div>
                    <span className="font-mono text-xl font-bold">
                      {scores[model.id] || 0}
                    </span>
                  </div>
                ))}
              </div>

              {/* Round Progress */}
              <div className="mt-6 pt-4 border-t">
                <div className="text-xs text-gray-400 uppercase mb-2">Progress</div>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: totalRounds }, (_, i) => (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono ${
                        i + 1 < currentRound
                          ? "bg-green-100 text-green-700"
                          : i + 1 === currentRound
                          ? "bg-amber-100 text-amber-700 ring-2 ring-amber-300"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* Clue Giver Rotation */}
              <div className="mt-4 pt-4 border-t">
                <div className="text-xs text-gray-400 uppercase mb-2">Clue Giver This Round</div>
                {roundData ? (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <span className="text-lg">🎤</span>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: roundData.clueGiver.color }} />
                    <span className="font-medium">{roundData.clueGiver.shortName}</span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">Waiting to start...</div>
                )}
              </div>
            </div>
          </div>

          {/* Main Game Area */}
          <div className="flex-1 min-w-0">
            {/* Current Round Info */}
            {roundData ? (
              <>
                <div className="card p-4 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-xs text-gray-400 uppercase">Round {roundData.round}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎤</span>
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: roundData.clueGiver.color }} />
                          <span className="font-semibold">{roundData.clueGiver.shortName}</span>
                          <span className="text-gray-400">is the clue giver</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-400 uppercase">Target</div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg shadow-sm"
                          style={{ backgroundColor: roundData.targetHex }}
                        />
                        <span className="font-mono">{roundData.targetCoordinate}</span>
                      </div>
                    </div>
                  </div>

                  {isClueGiverThinking ? (
                    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                      <div className="loading-spinner" />
                      <span>{roundData.clueGiver.shortName} is thinking of a clue...</span>
                    </div>
                  ) : roundData.clue ? (
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-400 uppercase mb-1">The Clue</div>
                      <div className="text-4xl font-bold">"{roundData.clue}"</div>
                    </div>
                  ) : null}
                </div>

                {/* Color Board */}
                <ColorBoard
                  targetCoordinate={roundData.targetCoordinate}
                  results={boardResults}
                  showZones={showScoringGrid}
                />

                {/* Round Results */}
                {roundData?.showScoring && (
                  <div className="mt-4 card p-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-500">
                          {roundData.clueGiver.shortName} earned{" "}
                        </span>
                        <span className="font-bold text-green-600">
                          +{roundData.clueGiverPoints} pts
                        </span>
                        <span className="text-sm text-gray-500"> as clue giver</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {roundData.clueGiverPoints} of 3 guessers in scoring zone
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Waiting to start */
              <div className="card p-12 text-center">
                <div className="text-6xl mb-4">🎨</div>
                <h2 className="text-2xl font-bold mb-2">Ready to Play!</h2>
                <p className="text-gray-500 mb-4">
                  Click "Start Tournament" to begin {selectedRounds} rounds of Hues & Cues.
                </p>
                <p className="text-sm text-gray-400">
                  Each round, one AI gives a clue and 3 others guess. Clue giver rotates each round.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRules(false)}>
          <div className="card p-6 max-w-lg w-full mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">📖 How to Play</h2>
              <button onClick={() => setShowRules(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>
            
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-base mb-1">🎯 The Goal</h3>
                <p className="text-gray-600">
                  Guide other players to guess your secret color using only a one-word clue!
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base mb-1">🎮 How Rounds Work</h3>
                <ul className="text-gray-600 space-y-1 list-disc list-inside">
                  <li>One AI is the <strong>Clue Giver</strong> each round (rotates)</li>
                  <li>The clue giver sees a secret target color</li>
                  <li>They give a <strong>one-word clue</strong> (no color names!)</li>
                  <li>The other 3 AIs try to guess the color's location</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-base mb-1">🏆 Scoring</h3>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <p className="text-gray-600">A 3×3 scoring grid is placed on the target:</p>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">3</span>
                    <span>Exact match (center)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-yellow-400 rounded flex items-center justify-center text-white text-xs font-bold">2</span>
                    <span>Inside the 3×3 grid (8 cells)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-orange-400 rounded flex items-center justify-center text-white text-xs font-bold">1</span>
                    <span>On the boundary (5×5 edge)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center text-gray-500 text-xs font-bold">0</span>
                    <span>Outside</span>
                  </div>
                  <p className="text-gray-600 mt-2">
                    <strong>Clue Giver</strong> earns 1 point for each guesser inside the 3×3 grid!
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-base mb-1">🎨 The Board</h3>
                <p className="text-gray-600">
                  480 colors arranged in a 20×24 grid. Rows A-T (top to bottom), Columns 1-24 (left to right).
                  Colors flow through the spectrum from reds to pinks.
                </p>
              </div>
            </div>

            <button onClick={() => setShowRules(false)} className="btn-primary w-full mt-6">
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Tournament Complete Modal */}
      {tournamentComplete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-8 max-w-md w-full mx-4 animate-fade-in">
            <div className="text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold mb-2">Tournament Complete!</h2>
              <p className="text-gray-500 mb-6">After {totalRounds} rounds, here are the final standings:</p>
              
              <div className="space-y-3 mb-6">
                {rankings.map((r, i) => (
                  <div
                    key={r.model.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      i === 0 ? "bg-amber-100 ring-2 ring-amber-400" :
                      i === 1 ? "bg-gray-100" :
                      i === 2 ? "bg-orange-50" :
                      "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : ""}
                      </span>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: r.model.color }} />
                      <span className="font-semibold">{r.model.shortName}</span>
                    </div>
                    <span className="font-mono text-2xl font-bold">{r.score}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setTournamentComplete(false)} 
                  className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button onClick={startTournament} className="flex-1 btn-primary">
                  Play Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
