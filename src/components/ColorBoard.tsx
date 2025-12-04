"use client";

import { ROWS, COLS, COLOR_MAP } from "@/lib/colorMap";
import { ModelResult } from "@/lib/types";
import { getScoringZones } from "@/lib/scoring";
import { useState, useMemo } from "react";

interface ColorBoardProps {
  targetCoordinate: string;
  results: ModelResult[];
  showZones?: boolean;
}

const CELL_SIZE = 24; // Bigger cells

export default function ColorBoard({
  targetCoordinate,
  results,
  showZones = true,
}: ColorBoardProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const zones = useMemo(
    () => getScoringZones(targetCoordinate),
    [targetCoordinate]
  );

  const innerZone = useMemo(() => new Set(zones.inner), [zones]);
  const outerZone = useMemo(() => new Set(zones.outer), [zones]);

  const guessMap = useMemo(() => {
    const map = new Map<string, ModelResult[]>();
    results.forEach((r) => {
      if (r.guessCoordinate) {
        const existing = map.get(r.guessCoordinate) || [];
        existing.push(r);
        map.set(r.guessCoordinate, existing);
      }
    });
    return map;
  }, [results]);

  return (
    <div className="card p-4 overflow-x-auto">
      {/* Column labels */}
      <div className="flex mb-1" style={{ marginLeft: "28px" }}>
        {COLS.map((col) => (
          <div
            key={col}
            className="text-center text-xs font-mono text-gray-400"
            style={{ width: `${CELL_SIZE}px`, minWidth: `${CELL_SIZE}px` }}
          >
            {col}
          </div>
        ))}
      </div>

      {/* Board grid */}
      <div className="flex flex-col">
        {ROWS.map((row) => (
          <div key={row} className="flex items-center">
            {/* Row label */}
            <div className="w-7 text-center text-xs font-mono text-gray-400 shrink-0">
              {row}
            </div>

            {/* Color cells */}
            {COLS.map((col) => {
              const coord = `${row}${col}`;
              const hex = COLOR_MAP[coord];
              const isTarget = coord === targetCoordinate;
              const isInner = showZones && innerZone.has(coord);
              const isOuter = showZones && outerZone.has(coord);
              const guesses = guessMap.get(coord);
              const hasGuess = guesses && guesses.length > 0;
              const isHovered = coord === hoveredCell;

              let zoneStyle = {};
              if (showZones) {
                if (isTarget) {
                  zoneStyle = {
                    outline: "3px solid #000",
                    outlineOffset: "-1px",
                  };
                } else if (isInner) {
                  zoneStyle = {
                    outline: "2px solid #000",
                    outlineOffset: "-1px",
                    backgroundColor: hex,
                  };
                } else if (isOuter) {
                  zoneStyle = {
                    outline: "1px solid rgba(0,0,0,0.5)",
                    outlineOffset: "-1px",
                  };
                }
              }

              return (
                <div
                  key={coord}
                  className="color-cell relative"
                  style={{
                    backgroundColor: hex,
                    width: `${CELL_SIZE}px`,
                    height: `${CELL_SIZE}px`,
                    minWidth: `${CELL_SIZE}px`,
                    outline: isHovered ? "3px solid #1a1a1a" : "none",
                    outlineOffset: "-1px",
                    zIndex: isHovered ? 20 : isTarget || hasGuess ? 10 : 1,
                    ...zoneStyle,
                  }}
                  onMouseEnter={() => setHoveredCell(coord)}
                  onMouseLeave={() => setHoveredCell(null)}
                  title={`${coord}: ${hex}${
                    isTarget ? " (TARGET)" : ""
                  }${isInner ? " (2 pts)" : ""}${isOuter ? " (1 pt)" : ""}`}
                >
                  {/* Target marker */}
                  {isTarget && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="w-5 h-5 rounded bg-white/90 flex items-center justify-center"
                        style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
                      >
                        <span className="text-sm font-bold text-green-600">
                          3
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Guess markers */}
                  {hasGuess && !isTarget && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex">
                        {guesses.slice(0, 3).map((g, i) => (
                          <div
                            key={g.model.id}
                            className="w-3 h-3 rounded-full border-2 border-white"
                            style={{
                              backgroundColor: g.model.color,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                              marginLeft: i > 0 ? "-4px" : "0",
                            }}
                            title={g.model.shortName}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Guess on target */}
                  {hasGuess && isTarget && (
                    <div className="absolute -top-1 -right-1 flex">
                      {guesses.slice(0, 3).map((g, i) => (
                        <div
                          key={g.model.id}
                          className="w-3 h-3 rounded-full border-2 border-white"
                          style={{
                            backgroundColor: g.model.color,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                            marginLeft: i > 0 ? "-4px" : "0",
                          }}
                          title={`${g.model.shortName} - Perfect!`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 mt-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 bg-gray-300 flex items-center justify-center"
            style={{ outline: "3px solid #000", outlineOffset: "-1px" }}
          >
            <span className="text-xs font-bold bg-white/90 px-1 rounded text-green-600">3</span>
          </div>
          <span>Target (3 pts)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 bg-gray-300"
            style={{ outline: "2px solid #000", outlineOffset: "-1px" }}
          />
          <span>Inner 3×3 (2 pts)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 bg-gray-300"
            style={{ outline: "1px solid rgba(0,0,0,0.5)", outlineOffset: "-1px" }}
          />
          <span>Outer ring (1 pt)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-600 border-2 border-white" />
          <span>Model Guess</span>
        </div>
        {hoveredCell && (
          <div className="ml-auto flex items-center gap-2 font-mono">
            <div
              className="w-6 h-6 rounded"
              style={{ backgroundColor: COLOR_MAP[hoveredCell] }}
            />
            <span>
              {hoveredCell}: {COLOR_MAP[hoveredCell]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
