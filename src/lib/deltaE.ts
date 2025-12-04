// Delta E 2000 (ΔE00) - The most accurate perceptual color difference formula
// Converts HEX to L*a*b* color space and calculates the color distance

// Convert HEX to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

// Convert RGB to XYZ color space
function rgbToXyz(r: number, g: number, b: number): { x: number; y: number; z: number } {
  // Normalize RGB values to 0-1
  let rNorm = r / 255;
  let gNorm = g / 255;
  let bNorm = b / 255;

  // Apply gamma correction (sRGB)
  rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92;
  gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92;
  bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92;

  // Scale
  rNorm *= 100;
  gNorm *= 100;
  bNorm *= 100;

  // Convert to XYZ using D65 illuminant
  return {
    x: rNorm * 0.4124564 + gNorm * 0.3575761 + bNorm * 0.1804375,
    y: rNorm * 0.2126729 + gNorm * 0.7151522 + bNorm * 0.0721750,
    z: rNorm * 0.0193339 + gNorm * 0.1191920 + bNorm * 0.9503041,
  };
}

// Convert XYZ to L*a*b* color space
function xyzToLab(x: number, y: number, z: number): { l: number; a: number; b: number } {
  // D65 reference white point
  const refX = 95.047;
  const refY = 100.0;
  const refZ = 108.883;

  x = x / refX;
  y = y / refY;
  z = z / refZ;

  const epsilon = 0.008856;
  const kappa = 903.3;

  x = x > epsilon ? Math.pow(x, 1 / 3) : (kappa * x + 16) / 116;
  y = y > epsilon ? Math.pow(y, 1 / 3) : (kappa * y + 16) / 116;
  z = z > epsilon ? Math.pow(z, 1 / 3) : (kappa * z + 16) / 116;

  return {
    l: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z),
  };
}

// Convert HEX directly to L*a*b*
export function hexToLab(hex: string): { l: number; a: number; b: number } {
  const rgb = hexToRgb(hex);
  const xyz = rgbToXyz(rgb.r, rgb.g, rgb.b);
  return xyzToLab(xyz.x, xyz.y, xyz.z);
}

// Delta E 2000 calculation
export function calculateDeltaE(hex1: string, hex2: string): number {
  const lab1 = hexToLab(hex1);
  const lab2 = hexToLab(hex2);

  return deltaE2000(lab1, lab2);
}

// Core Delta E 2000 formula implementation
function deltaE2000(
  lab1: { l: number; a: number; b: number },
  lab2: { l: number; a: number; b: number }
): number {
  const { l: L1, a: a1, b: b1 } = lab1;
  const { l: L2, a: a2, b: b2 } = lab2;

  // Weight factors (for most applications, these are all 1)
  const kL = 1;
  const kC = 1;
  const kH = 1;

  // Calculate C' and h' for both colors
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);

  const C_avg = (C1 + C2) / 2;
  const C_avg_pow7 = Math.pow(C_avg, 7);
  const G = 0.5 * (1 - Math.sqrt(C_avg_pow7 / (C_avg_pow7 + Math.pow(25, 7))));

  const a1_prime = a1 * (1 + G);
  const a2_prime = a2 * (1 + G);

  const C1_prime = Math.sqrt(a1_prime * a1_prime + b1 * b1);
  const C2_prime = Math.sqrt(a2_prime * a2_prime + b2 * b2);

  // Calculate h' values
  let h1_prime = Math.atan2(b1, a1_prime) * (180 / Math.PI);
  if (h1_prime < 0) h1_prime += 360;

  let h2_prime = Math.atan2(b2, a2_prime) * (180 / Math.PI);
  if (h2_prime < 0) h2_prime += 360;

  // Calculate delta values
  const deltaL_prime = L2 - L1;
  const deltaC_prime = C2_prime - C1_prime;

  let deltah_prime: number;
  if (C1_prime * C2_prime === 0) {
    deltah_prime = 0;
  } else if (Math.abs(h2_prime - h1_prime) <= 180) {
    deltah_prime = h2_prime - h1_prime;
  } else if (h2_prime - h1_prime > 180) {
    deltah_prime = h2_prime - h1_prime - 360;
  } else {
    deltah_prime = h2_prime - h1_prime + 360;
  }

  const deltaH_prime = 2 * Math.sqrt(C1_prime * C2_prime) * Math.sin((deltah_prime * Math.PI) / 360);

  // Calculate average values
  const L_avg_prime = (L1 + L2) / 2;
  const C_avg_prime = (C1_prime + C2_prime) / 2;

  let h_avg_prime: number;
  if (C1_prime * C2_prime === 0) {
    h_avg_prime = h1_prime + h2_prime;
  } else if (Math.abs(h1_prime - h2_prime) <= 180) {
    h_avg_prime = (h1_prime + h2_prime) / 2;
  } else if (h1_prime + h2_prime < 360) {
    h_avg_prime = (h1_prime + h2_prime + 360) / 2;
  } else {
    h_avg_prime = (h1_prime + h2_prime - 360) / 2;
  }

  // Calculate T, SL, SC, SH
  const T =
    1 -
    0.17 * Math.cos(((h_avg_prime - 30) * Math.PI) / 180) +
    0.24 * Math.cos((2 * h_avg_prime * Math.PI) / 180) +
    0.32 * Math.cos(((3 * h_avg_prime + 6) * Math.PI) / 180) -
    0.20 * Math.cos(((4 * h_avg_prime - 63) * Math.PI) / 180);

  const deltaTheta = 30 * Math.exp(-Math.pow((h_avg_prime - 275) / 25, 2));

  const C_avg_prime_pow7 = Math.pow(C_avg_prime, 7);
  const RC = 2 * Math.sqrt(C_avg_prime_pow7 / (C_avg_prime_pow7 + Math.pow(25, 7)));

  const L_avg_prime_minus50_sq = Math.pow(L_avg_prime - 50, 2);
  const SL = 1 + (0.015 * L_avg_prime_minus50_sq) / Math.sqrt(20 + L_avg_prime_minus50_sq);
  const SC = 1 + 0.045 * C_avg_prime;
  const SH = 1 + 0.015 * C_avg_prime * T;

  const RT = -Math.sin((2 * deltaTheta * Math.PI) / 180) * RC;

  // Final Delta E 2000 calculation
  const deltaE = Math.sqrt(
    Math.pow(deltaL_prime / (kL * SL), 2) +
      Math.pow(deltaC_prime / (kC * SC), 2) +
      Math.pow(deltaH_prime / (kH * SH), 2) +
      RT * (deltaC_prime / (kC * SC)) * (deltaH_prime / (kH * SH))
  );

  return Math.round(deltaE * 100) / 100; // Round to 2 decimal places
}

// Score interpretation helper
export function interpretDeltaE(deltaE: number): string {
  if (deltaE < 1) return "Not perceptible by human eye";
  if (deltaE < 2) return "Perceptible through close observation";
  if (deltaE < 3.5) return "Perceptible at a glance";
  if (deltaE < 5) return "Noticeable difference";
  if (deltaE < 10) return "Clear difference";
  if (deltaE < 20) return "Significant difference";
  return "Very different colors";
}

// Calculate accuracy percentage (inverse of deltaE, capped)
export function calculateAccuracy(deltaE: number): number {
  // Max deltaE is approximately 100 for completely opposite colors
  const maxDeltaE = 100;
  const accuracy = Math.max(0, Math.min(100, ((maxDeltaE - deltaE) / maxDeltaE) * 100));
  return Math.round(accuracy * 10) / 10;
}

