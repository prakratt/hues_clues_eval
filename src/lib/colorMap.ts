// Hues and Cues Board: 20 rows (A-T) x 24 columns (1-24) = 480 colors
// The board represents a continuous color spectrum with varying saturation and lightness

export type Coordinate = `${string}${number}`;

// Row labels A-T
export const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'] as const;
export const COLS = Array.from({ length: 24 }, (_, i) => i + 1);

// Generate HSL colors for the board
// Columns control hue (0-360), rows control saturation/lightness
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Generate the 480-color map
function generateColorMap(): Record<string, string> {
  const colorMap: Record<string, string> = {};
  
  ROWS.forEach((row, rowIndex) => {
    COLS.forEach((col) => {
      // Hue: columns map to full color spectrum (0-360)
      // Shift so reds are in the middle for aesthetics
      const hue = ((col - 1) / 24) * 360;
      
      // Saturation and lightness vary by row to create depth
      // Top rows (A-E): lighter, less saturated (pastels)
      // Middle rows (F-O): more saturated, medium lightness (vivid)
      // Bottom rows (P-T): darker, more saturated (deep)
      
      let saturation: number;
      let lightness: number;
      
      if (rowIndex < 5) {
        // Rows A-E: Pastels (high lightness, lower saturation)
        saturation = 40 + (rowIndex * 8); // 40-72%
        lightness = 85 - (rowIndex * 5); // 85-65%
      } else if (rowIndex < 15) {
        // Rows F-O: Vivid colors (high saturation, medium lightness)
        saturation = 75 + ((rowIndex - 5) * 2); // 75-95%
        lightness = 60 - ((rowIndex - 5) * 2); // 60-40%
      } else {
        // Rows P-T: Deep/dark colors (high saturation, low lightness)
        saturation = 80 - ((rowIndex - 15) * 5); // 80-60%
        lightness = 35 - ((rowIndex - 15) * 4); // 35-19%
      }
      
      const coord = `${row}${col}`;
      colorMap[coord] = hslToHex(hue, saturation, lightness);
    });
  });
  
  return colorMap;
}

export const COLOR_MAP: Record<string, string> = generateColorMap();

// Clue dictionary: Common color-related words mapped to their best-fit coordinates
export const CLUE_DICTIONARY: Record<string, { coordinate: string; description: string }> = {
  // Reds and Pinks
  "Cherry": { coordinate: "H1", description: "Bright cherry red" },
  "Rose": { coordinate: "D1", description: "Soft pink rose" },
  "Crimson": { coordinate: "L1", description: "Deep crimson red" },
  "Blush": { coordinate: "B1", description: "Light blush pink" },
  "Ruby": { coordinate: "N1", description: "Rich ruby red" },
  "Coral": { coordinate: "F2", description: "Warm coral" },
  "Salmon": { coordinate: "D2", description: "Soft salmon pink" },
  "Brick": { coordinate: "P1", description: "Dark brick red" },
  
  // Oranges
  "Tangerine": { coordinate: "G3", description: "Bright tangerine orange" },
  "Sunset": { coordinate: "H4", description: "Warm sunset orange" },
  "Peach": { coordinate: "C3", description: "Soft peach" },
  "Pumpkin": { coordinate: "J3", description: "Vivid pumpkin orange" },
  "Rust": { coordinate: "O3", description: "Dark rust orange" },
  "Apricot": { coordinate: "D4", description: "Light apricot" },
  "Amber": { coordinate: "K4", description: "Golden amber" },
  
  // Yellows
  "Banana": { coordinate: "F5", description: "Bright banana yellow" },
  "Lemon": { coordinate: "G6", description: "Zesty lemon yellow" },
  "Gold": { coordinate: "J5", description: "Rich gold" },
  "Canary": { coordinate: "E6", description: "Bright canary yellow" },
  "Mustard": { coordinate: "L5", description: "Dark mustard yellow" },
  "Butter": { coordinate: "B5", description: "Soft butter yellow" },
  "Honey": { coordinate: "I6", description: "Warm honey gold" },
  "Sunflower": { coordinate: "H5", description: "Vibrant sunflower yellow" },
  
  // Greens
  "Lime": { coordinate: "G8", description: "Bright lime green" },
  "Grass": { coordinate: "I9", description: "Fresh grass green" },
  "Forest": { coordinate: "O10", description: "Deep forest green" },
  "Mint": { coordinate: "C9", description: "Cool mint green" },
  "Olive": { coordinate: "M8", description: "Earthy olive green" },
  "Emerald": { coordinate: "K10", description: "Vivid emerald green" },
  "Sage": { coordinate: "E9", description: "Soft sage green" },
  "Jungle": { coordinate: "N10", description: "Dark jungle green" },
  "Avocado": { coordinate: "J8", description: "Avocado green" },
  "Seafoam": { coordinate: "D11", description: "Light seafoam" },
  
  // Cyans and Teals
  "Teal": { coordinate: "K12", description: "Rich teal" },
  "Turquoise": { coordinate: "G12", description: "Bright turquoise" },
  "Aqua": { coordinate: "E12", description: "Light aqua" },
  "Cyan": { coordinate: "F13", description: "Pure cyan" },
  "Ocean": { coordinate: "L13", description: "Deep ocean blue-green" },
  "Lagoon": { coordinate: "I13", description: "Tropical lagoon" },
  
  // Blues
  "Sky": { coordinate: "E15", description: "Clear sky blue" },
  "Navy": { coordinate: "Q16", description: "Deep navy blue" },
  "Cobalt": { coordinate: "K15", description: "Vivid cobalt blue" },
  "Azure": { coordinate: "G15", description: "Bright azure" },
  "Sapphire": { coordinate: "M16", description: "Rich sapphire blue" },
  "Denim": { coordinate: "J16", description: "Faded denim blue" },
  "Baby": { coordinate: "B15", description: "Soft baby blue" },
  "Royal": { coordinate: "L16", description: "Royal blue" },
  "Midnight": { coordinate: "R17", description: "Dark midnight blue" },
  "Ice": { coordinate: "C14", description: "Icy light blue" },
  
  // Purples and Violets
  "Lavender": { coordinate: "D18", description: "Soft lavender" },
  "Violet": { coordinate: "H19", description: "Vivid violet" },
  "Grape": { coordinate: "K19", description: "Deep grape purple" },
  "Plum": { coordinate: "N19", description: "Rich plum" },
  "Orchid": { coordinate: "F19", description: "Bright orchid" },
  "Eggplant": { coordinate: "P19", description: "Dark eggplant purple" },
  "Lilac": { coordinate: "C19", description: "Pale lilac" },
  "Amethyst": { coordinate: "I19", description: "Amethyst purple" },
  
  // Magentas and Pinks
  "Magenta": { coordinate: "H21", description: "Hot magenta" },
  "Fuchsia": { coordinate: "G21", description: "Bright fuchsia" },
  "Berry": { coordinate: "J22", description: "Deep berry pink" },
  "Bubblegum": { coordinate: "D22", description: "Bright bubblegum pink" },
  "Hot Pink": { coordinate: "F22", description: "Hot pink" },
  "Raspberry": { coordinate: "L22", description: "Rich raspberry" },
  
  // Neutrals and Earth Tones
  "Sand": { coordinate: "C4", description: "Warm sand" },
  "Caramel": { coordinate: "K3", description: "Rich caramel" },
  "Chocolate": { coordinate: "Q4", description: "Dark chocolate brown" },
  "Coffee": { coordinate: "O4", description: "Coffee brown" },
  "Tan": { coordinate: "E4", description: "Light tan" },
  "Sienna": { coordinate: "N3", description: "Burnt sienna" }
};

// Get all available clue words
export const CLUE_WORDS = Object.keys(CLUE_DICTIONARY);

// Helper function to get random clue
export function getRandomClue(): { word: string; coordinate: string; hexColor: string } {
  const randomIndex = Math.floor(Math.random() * CLUE_WORDS.length);
  const word = CLUE_WORDS[randomIndex];
  const { coordinate } = CLUE_DICTIONARY[word];
  const hexColor = COLOR_MAP[coordinate];
  return { word, coordinate, hexColor };
}

// Parse coordinate to get row and column indices
export function parseCoordinate(coord: string): { rowIndex: number; colIndex: number } | null {
  const match = coord.match(/^([A-T])(\d+)$/i);
  if (!match) return null;
  
  const rowLetter = match[1].toUpperCase();
  const colNumber = parseInt(match[2], 10);
  
  const rowIndex = ROWS.indexOf(rowLetter as typeof ROWS[number]);
  const colIndex = colNumber - 1;
  
  if (rowIndex === -1 || colIndex < 0 || colIndex >= 24) return null;
  
  return { rowIndex, colIndex };
}

// Get color by coordinate
export function getColorByCoordinate(coord: string): string | null {
  const normalized = coord.toUpperCase().replace(/\s/g, '');
  return COLOR_MAP[normalized] || null;
}

// Generate coordinate from row and column indices
export function getCoordinate(rowIndex: number, colIndex: number): string {
  return `${ROWS[rowIndex]}${colIndex + 1}`;
}

