import SunCalc from "suncalc";

// ---------------------------------------------------------------------------
// 0. Real-time Celestial Positions — SunCalc
//
// Returns Moon altitude, illumination fraction, and Sun altitude
// for a given lat/lon and date/time. Replaces all mock values.
// ---------------------------------------------------------------------------
export interface CelestialPositions {
  moonAltDeg: number;        // –90 … +90°  (negative = below horizon)
  moonIllumination: number;  // 0.0 … 1.0
  sunAltDeg: number;         // –90 … +90°  (veto when > –18°)
}

export const getCelestialPositions = (
  lat: number,
  lon: number,
  date: Date
): CelestialPositions => {
  const moonPos = SunCalc.getMoonPosition(date, lat, lon);
  const moonIllum = SunCalc.getMoonIllumination(date);
  const sunPos = SunCalc.getPosition(date, lat, lon);

  return {
    moonAltDeg: moonPos.altitude * (180 / Math.PI),
    moonIllumination: moonIllum.fraction,
    sunAltDeg: sunPos.altitude * (180 / Math.PI),
  };
};

/**
 * Interstellar Atmospheric Optics & Astronomy Core Models
 *
 * Scientific models implemented:
 * 1. Beer-Lambert atmospheric transparency
 * 2. Spherical trigonometry (Moon-Target separation)
 * 3. Krisciunas-Schaefer sky brightness (Dynamic SQM)
 * 4. Milky Way (Sagittarius A*) visibility
 * 5. Weighted quality scoring with hard-veto conditions
 * 6. Ensemble forecast uncertainty (sigma spread)
 * 7. Saemundsson atmospheric refraction correction
 * 8. Jet Stream scintillation risk (500 hPa wind)
 * 9. CAMS / manual AOD priority resolver
 */

export const toRadian = (deg: number): number => deg * (Math.PI / 180);
export const toDegree = (rad: number): number => rad * (180 / Math.PI);

// ---------------------------------------------------------------------------
// 1. True Transparency — Beer-Lambert law
// ---------------------------------------------------------------------------
export const calculateTrueTransparency = (
  aqi: number,
  humidity: number,
  aerosolOpticalDepth: number
): { k: number; transparency: number } => {
  const k =
    0.15 +
    0.001 * aqi +
    (humidity > 60 ? 0.002 * (humidity - 60) : 0) +
    aerosolOpticalDepth;
  const transparency = Math.exp(-k * 1) * 100;
  return { transparency: Math.max(0, Math.min(100, transparency)), k };
};

// ---------------------------------------------------------------------------
// 2. Moon Separation — spherical trigonometry
// ---------------------------------------------------------------------------
export const calculateMoonSeparation = (
  altMoon: number,
  azMoon: number,
  altTarget: number,
  azTarget: number
): number => {
  const altMoonRad = toRadian(altMoon);
  const altTargetRad = toRadian(altTarget);
  const azDiffRad = toRadian(azMoon - azTarget);
  const rhoRad = Math.acos(
    Math.sin(altMoonRad) * Math.sin(altTargetRad) +
    Math.cos(altMoonRad) * Math.cos(altTargetRad) * Math.cos(azDiffRad)
  );
  return toDegree(rhoRad);
};

// ---------------------------------------------------------------------------
// 3. Dynamic SQM — modified Krisciunas-Schaefer (2001)
// ---------------------------------------------------------------------------
export const calculateDynamicSQM = (
  baseBortleSqm: number,
  altMoon: number,
  moonIllumination: number,
  k: number,
  rhoDegree: number,
  xTarget = 1
): number => {
  const baseLunarPenalty =
    altMoon > 0
      ? moonIllumination * Math.sin(toRadian(altMoon)) * k * 5.0
      : 0;
  const targetLunarPenalty =
    baseLunarPenalty * (1 + Math.pow(180 / (rhoDegree + 10), 2));
  const dynamicSqm =
    baseBortleSqm - targetLunarPenalty - 1.25 * k * xTarget;
  return Math.max(0, dynamicSqm);
};

// ---------------------------------------------------------------------------
// 4. Milky Way visibility
// ---------------------------------------------------------------------------
export const checkMilkyWayVisibility = (
  altSagittariusA: number,
  dynamicSqmZenith: number
): { isVisible: boolean; reason: string } => {
  if (altSagittariusA <= 10)
    return { isVisible: false, reason: "Galactic Center is too low (< 10°)" };
  if (dynamicSqmZenith <= 19.5)
    return {
      isVisible: false,
      reason: `Sky is too bright (SQM: ${dynamicSqmZenith.toFixed(2)})`,
    };
  return { isVisible: true, reason: "Optimal conditions for Milky Way photography" };
};

// ---------------------------------------------------------------------------
// 5. Astro Quality Score
// ---------------------------------------------------------------------------
export interface AstroQualityParams {
  cloudCover: number;
  sunAlt: number;
  trueTransparency: number;
  dynamicSqm: number;
  seeingScore: number;
  deltaTempDewPt: number;
}

export const calculateAstroQualityScore = (
  params: AstroQualityParams
): { score: number; isVetoed: boolean; vetoReason?: string } => {
  const {
    cloudCover,
    sunAlt,
    trueTransparency,
    dynamicSqm,
    seeingScore,
    deltaTempDewPt,
  } = params;

  // Hard veto conditions
  if (cloudCover > 70)
    return { score: 0, isVetoed: true, vetoReason: "Cloud cover > 70%" };
  if (sunAlt > -18)
    return {
      score: 0,
      isVetoed: true,
      vetoReason: "Sun is above astronomical twilight (-18°)",
    };

  const cloudScore = Math.max(0, 40 * (1 - cloudCover / 70));
  const transparencyScore = 20 * (trueTransparency / 100);
  const sqmNorm = Math.max(
    0,
    Math.min(1, (dynamicSqm - 17.0) / (22.0 - 17.0))
  );
  const sqmScore = 20 * sqmNorm;
  const seeingScorePts = 10 * (seeingScore / 100);

  let deltaNorm = 0;
  if (deltaTempDewPt >= 5) deltaNorm = 1;
  else if (deltaTempDewPt > 1) deltaNorm = (deltaTempDewPt - 1) / 4;
  const dewScore = 10 * deltaNorm;

  const totalScore = Math.round(
    cloudScore + transparencyScore + sqmScore + seeingScorePts + dewScore
  );

  return { score: Math.min(100, Math.max(0, totalScore)), isVetoed: false };
};

// ---------------------------------------------------------------------------
// 6. Forecast Uncertainty — ensemble sigma spread
// ---------------------------------------------------------------------------
export const calculateForecastUncertainty = (predictions: number[]): number => {
  if (predictions.length === 0) return 0;
  const mean = predictions.reduce((a, b) => a + b, 0) / predictions.length;
  const variance =
    predictions.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
    predictions.length;
  return Math.sqrt(variance);
};

// ---------------------------------------------------------------------------
// 7. Atmospheric Refraction — Saemundsson (1986)
//
// R(arcmin) = 1.02 / tan(Alt + 10.3/(Alt + 5.11)) × (P/1010) × (283/(273+T))
//
// Below Alt 15°: chromatic dispersion requires an ADC corrector.
// Below Alt  5°: dispersion is severe (15–30"), imaging impractical.
// ---------------------------------------------------------------------------
export const calculateAtmosphericRefraction = (
  altitudeDeg: number,
  pressureHPa = 1013.25,
  tempCelsius = 10
): {
  refractionArcmin: number;
  dispersionWarning: boolean;
  dispersionLevel: "none" | "moderate" | "severe";
} => {
  if (altitudeDeg < 0)
    return { refractionArcmin: 0, dispersionWarning: false, dispersionLevel: "none" };

  const R0 =
    1.02 / Math.tan(toRadian(altitudeDeg + 10.3 / (altitudeDeg + 5.11)));
  const correctionFactor = (pressureHPa / 1010) * (283 / (273 + tempCelsius));
  const refractionArcmin = R0 * correctionFactor;

  let dispersionLevel: "none" | "moderate" | "severe" = "none";
  if (altitudeDeg < 5) dispersionLevel = "severe";
  else if (altitudeDeg < 15) dispersionLevel = "moderate";

  return {
    refractionArcmin,
    dispersionWarning: dispersionLevel !== "none",
    dispersionLevel,
  };
};

// ---------------------------------------------------------------------------
// 8. Jet Stream Scintillation Risk — 500 hPa wind
//
// Empirical thresholds (Antoniucci 2016, astrophotographer community):
//   < 30 km/h → negligible   | 30–60 → moderate | 60–90 → high | > 90 → severe
// ---------------------------------------------------------------------------
export const assessJetStreamRisk = (
  windSpeed500hPa: number
): {
  level: "good" | "moderate" | "high" | "severe";
  fwhmBloatArcsec: number;
  message: string;
  color: string;
} => {
  if (windSpeed500hPa < 30)
    return { level: "good", fwhmBloatArcsec: 0, message: "Jet Stream yếu — seeing ổn định", color: "#34d399" };
  if (windSpeed500hPa < 60)
    return { level: "moderate", fwhmBloatArcsec: 1.5, message: `Jet Stream trung bình (${windSpeed500hPa.toFixed(0)} km/h) — seeing bị ảnh hưởng nhẹ`, color: "#fbbf24" };
  if (windSpeed500hPa < 90)
    return { level: "high", fwhmBloatArcsec: 3.0, message: `Jet Stream mạnh (${windSpeed500hPa.toFixed(0)} km/h) — scintillation cao tần, hành tinh bị mờ`, color: "#f97316" };
  return { level: "severe", fwhmBloatArcsec: 5.0, message: `Jet Stream cực mạnh (${windSpeed500hPa.toFixed(0)} km/h) — chụp ảnh không khả thi`, color: "#ef4444" };
};

// ---------------------------------------------------------------------------
// 9. CAMS-aware AOD resolver
//
// Priority: Settings manual override > CAMS real-time > default 0.1
// ---------------------------------------------------------------------------
export const resolveAOD = (
  manualOverride: number | null,
  camsAod: number | null
): { aod: number; source: "manual" | "CAMS" | "default" } => {
  if (manualOverride !== null && manualOverride >= 0)
    return { aod: manualOverride, source: "manual" };
  if (camsAod !== null && camsAod >= 0)
    return { aod: camsAod, source: "CAMS" };
  return { aod: 0.1, source: "default" };
};
