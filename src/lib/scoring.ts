// Hues and Cues Grid-Based Scoring System
// 
// Scoring zones (centered on target):
// - Center (exact match): 3 points
// - Inner ring (3x3 square, 8 cells): 2 points  
// - Outer ring (5x5 boundary, 16 cells): 1 point
// - Outside: 0 points

import { ROWS, parseCoordinate } from "./colorMap";

export interface ScoreResult {
  score: number;
  zone: "exact" | "inner" | "outer" | "miss";
  distance: number; // Manhattan-like grid distance
}

// Calculate the grid distance between two coordinates
export function getGridDistance(
  coord1: string,
  coord2: string
): { rowDiff: number; colDiff: number } | null {
  const parsed1 = parseCoordinate(coord1);
  const parsed2 = parseCoordinate(coord2);

  if (!parsed1 || !parsed2) return null;

  return {
    rowDiff: Math.abs(parsed1.rowIndex - parsed2.rowIndex),
    colDiff: Math.abs(parsed1.colIndex - parsed2.colIndex),
  };
}

// Calculate the score based on grid proximity
export function calculateScore(
  guessCoordinate: string,
  targetCoordinate: string
): ScoreResult {
  const distance = getGridDistance(guessCoordinate, targetCoordinate);

  if (!distance) {
    return { score: 0, zone: "miss", distance: Infinity };
  }

  const { rowDiff, colDiff } = distance;
  const maxDiff = Math.max(rowDiff, colDiff);

  // Exact match - center of target
  if (maxDiff === 0) {
    return { score: 3, zone: "exact", distance: 0 };
  }

  // Inner ring - within 3x3 square (1 cell away in any direction)
  if (maxDiff === 1) {
    return { score: 2, zone: "inner", distance: 1 };
  }

  // Outer ring - boundary of 5x5 square (2 cells away in any direction)
  if (maxDiff === 2) {
    return { score: 1, zone: "outer", distance: 2 };
  }

  // Outside scoring zone
  return { score: 0, zone: "miss", distance: maxDiff };
}

// Get all coordinates in each scoring zone for visualization
export function getScoringZones(targetCoordinate: string): {
  exact: string[];
  inner: string[];
  outer: string[];
} {
  const parsed = parseCoordinate(targetCoordinate);
  if (!parsed) {
    return { exact: [], inner: [], outer: [] };
  }

  const { rowIndex: targetRow, colIndex: targetCol } = parsed;
  const exact: string[] = [];
  const inner: string[] = [];
  const outer: string[] = [];

  // Check all nearby cells
  for (let rowOffset = -2; rowOffset <= 2; rowOffset++) {
    for (let colOffset = -2; colOffset <= 2; colOffset++) {
      const newRow = targetRow + rowOffset;
      const newCol = targetCol + colOffset;

      // Check bounds
      if (newRow < 0 || newRow >= 20 || newCol < 0 || newCol >= 24) continue;

      const coord = `${ROWS[newRow]}${newCol + 1}`;
      const maxDiff = Math.max(Math.abs(rowOffset), Math.abs(colOffset));

      if (maxDiff === 0) {
        exact.push(coord);
      } else if (maxDiff === 1) {
        inner.push(coord);
      } else if (maxDiff === 2) {
        outer.push(coord);
      }
    }
  }

  return { exact, inner, outer };
}

// Get zone label for display
export function getZoneLabel(zone: ScoreResult["zone"]): string {
  switch (zone) {
    case "exact":
      return "Perfect! 🎯";
    case "inner":
      return "Excellent!";
    case "outer":
      return "Close!";
    case "miss":
      return "Miss";
  }
}

// Get zone color for display
export function getZoneColor(zone: ScoreResult["zone"]): string {
  switch (zone) {
    case "exact":
      return "#22c55e"; // green
    case "inner":
      return "#eab308"; // yellow
    case "outer":
      return "#f97316"; // orange
    case "miss":
      return "#94a3b8"; // gray
  }
}

