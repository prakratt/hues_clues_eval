"use client";

import { ModelResult } from "@/lib/types";
import { getZoneLabel, getZoneColor } from "@/lib/scoring";

interface ModelCardProps {
  result: ModelResult;
  targetHex: string;
  targetCoordinate: string;
  animationDelay?: number;
}

function getRankEmoji(rank: number | undefined): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
}

function getRankStyle(rank: number | undefined): string {
  if (rank === 1) return "ring-2 ring-amber-400 shadow-lg shadow-amber-100";
  if (rank === 2) return "ring-2 ring-gray-300";
  if (rank === 3) return "ring-2 ring-amber-600";
  return "";
}

export default function ModelCard({
  result,
  targetHex,
  targetCoordinate,
  animationDelay = 0,
}: ModelCardProps) {
  const {
    model,
    guessCoordinate,
    guessHex,
    reasoning,
    score,
    zone,
    gridDistance,
    rank,
    error,
    responseTime,
  } = result;

  const zoneColor = zone ? getZoneColor(zone) : "#94a3b8";
  const zoneLabel = zone ? getZoneLabel(zone) : "—";

  return (
    <div
      className={`card p-4 animate-fade-in ${getRankStyle(rank)}`}
      style={{
        animationDelay: `${animationDelay}ms`,
        opacity: 0,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: model.color }}
          />
          <span className="font-semibold text-sm">{model.shortName}</span>
        </div>
        <div className="flex items-center gap-2">
          {rank && (
            <span className="rank-badge text-lg">{getRankEmoji(rank)}</span>
          )}
          <span className="text-xs text-gray-400 font-mono">#{rank ?? "-"}</span>
        </div>
      </div>

      {/* Color comparison */}
      {!error && guessHex && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <div className="text-[10px] text-gray-400 mb-1">GUESS</div>
            <div
              className="h-12 rounded-lg flex items-center justify-center relative overflow-hidden"
              style={{ backgroundColor: guessHex }}
            >
              <span
                className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
                style={{
                  backgroundColor: "rgba(255,255,255,0.9)",
                  color: "#1a1a1a",
                }}
              >
                {guessCoordinate}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div
              className="text-xl font-bold"
              style={{ color: zoneColor }}
            >
              →
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-gray-400 mb-1">TARGET</div>
            <div
              className="h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: targetHex }}
            >
              <span
                className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
                style={{
                  backgroundColor: "rgba(255,255,255,0.9)",
                  color: "#1a1a1a",
                }}
              >
                {targetCoordinate}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-100">
          <div className="text-xs text-red-600 font-medium">Error</div>
          <div className="text-xs text-red-500 mt-1 line-clamp-2">{error}</div>
        </div>
      )}

      {/* Score */}
      {!error && (
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400">SCORE</span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${zoneColor}20`,
                color: zoneColor,
              }}
            >
              {zoneLabel}
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className="font-mono text-4xl font-bold"
              style={{ color: zoneColor }}
            >
              {score}
            </span>
            <span className="text-gray-400 text-sm">pts</span>
          </div>
          {gridDistance !== null && gridDistance > 0 && (
            <div className="text-[10px] text-gray-400 mt-1">
              {gridDistance === 1
                ? "1 cell away"
                : gridDistance === 2
                ? "2 cells away"
                : `${gridDistance} cells away`}
            </div>
          )}
        </div>
      )}

      {/* Reasoning */}
      {reasoning && (
        <div className="mb-3">
          <div className="text-[10px] text-gray-400 mb-1">REASONING</div>
          <p className="text-xs text-gray-600 line-clamp-2">{reasoning}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-gray-100">
        <span className="font-mono">{(responseTime / 1000).toFixed(2)}s</span>
        <span className="truncate ml-2" title={guessHex || ""}>
          {guessHex || "-"}
        </span>
      </div>
    </div>
  );
}
