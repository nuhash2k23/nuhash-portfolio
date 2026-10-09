/**
 * Rough centre of each country [lon, lat], so the globe only needs a name.
 * Missing one? Add a line — any [lon, lat] inside the country works.
 */
export const COUNTRY_COORDS: Record<string, [number, number]> = {
  Afghanistan: [67.71, 33.94],
  Albania: [20.17, 41.15],
  Algeria: [1.66, 28.03],
  Andorra: [1.52, 42.55],
  Argentina: [-63.62, -38.42],
  Armenia: [45.04, 40.07],
  Australia: [134.5, -25.7],
  Austria: [14.55, 47.52],
  Azerbaijan: [47.58, 40.14],
  Bahrain: [50.56, 26.07],
  Bangladesh: [90.36, 23.68],
  Belarus: [27.95, 53.71],
  Belgium: [4.47, 50.5],
  Bhutan: [90.43, 27.51],
  'Bosnia and Herzegovina': [17.68, 43.92],
  Brazil: [-51.93, -14.24],
  Bulgaria: [25.49, 42.73],
  Cambodia: [104.99, 12.57],
  Canada: [-106.35, 56.13],
  Chile: [-71.54, -35.68],
  China: [104.2, 35.86],
  Colombia: [-74.3, 4.57],
  'Costa Rica': [-83.75, 9.75],
  Croatia: [15.2, 45.1],
  Cyprus: [33.43, 35.13],
  Czechia: [15.47, 49.82],
  Denmark: [9.5, 56.26],
  'Dominican Republic': [-70.16, 18.74],
  Ecuador: [-78.18, -1.83],
  Egypt: [30.8, 26.82],
  Estonia: [25.01, 58.6],
  Ethiopia: [40.49, 9.15],
  Finland: [25.75, 61.92],
  France: [2.21, 46.23],
  Georgia: [43.36, 42.32],
  Germany: [10.45, 51.17],
  Ghana: [-1.02, 7.95],
  Greece: [21.82, 39.07],
  'Hong Kong': [114.17, 22.32],
  Hungary: [19.5, 47.16],
  Iceland: [-19.02, 64.96],
  India: [78.96, 20.59],
  Indonesia: [113.92, -0.79],
  Iran: [53.69, 32.43],
  Iraq: [43.68, 33.22],
  Ireland: [-8.24, 53.41],
  Israel: [34.85, 31.05],
  Italy: [12.57, 41.87],
  Jamaica: [-77.3, 18.11],
  Japan: [138.25, 36.2],
  Jordan: [36.24, 30.59],
  Kazakhstan: [66.92, 48.02],
  Kenya: [37.91, -0.02],
  Kosovo: [20.9, 42.6],
  Kuwait: [47.48, 29.31],
  Latvia: [24.6, 56.88],
  Lebanon: [35.86, 33.85],
  Liechtenstein: [9.55, 47.17],
  Lithuania: [23.88, 55.17],
  Luxembourg: [6.13, 49.82],
  Malaysia: [101.98, 4.21],
  Maldives: [73.22, 3.2],
  Malta: [14.38, 35.94],
  Mauritius: [57.55, -20.35],
  Mexico: [-102.55, 23.63],
  Moldova: [28.37, 47.41],
  Monaco: [7.42, 43.74],
  Montenegro: [19.37, 42.71],
  Morocco: [-7.09, 31.79],
  Myanmar: [95.96, 21.91],
  Nepal: [84.12, 28.39],
  Netherlands: [5.29, 52.13],
  'New Zealand': [174.89, -40.9],
  Nigeria: [8.68, 9.08],
  'North Macedonia': [21.75, 41.61],
  Norway: [8.47, 60.47],
  Oman: [55.92, 21.51],
  Pakistan: [69.35, 30.38],
  Panama: [-80.78, 8.54],
  Peru: [-75.02, -9.19],
  Philippines: [121.77, 12.88],
  Poland: [19.15, 51.92],
  Portugal: [-8.22, 39.4],
  'Puerto Rico': [-66.59, 18.22],
  Qatar: [51.18, 25.35],
  Romania: [24.97, 45.94],
  Russia: [37.62, 55.75], // Moscow — the centre would be in Siberia
  'Saudi Arabia': [45.08, 23.89],
  Serbia: [21.01, 44.02],
  Singapore: [103.82, 1.35],
  Slovakia: [19.7, 48.67],
  Slovenia: [14.99, 46.15],
  'South Africa': [22.94, -30.56],
  'South Korea': [127.77, 35.91],
  Spain: [-3.75, 40.46],
  'Sri Lanka': [80.77, 7.87],
  Sweden: [16.5, 60.13],
  Switzerland: [8.23, 46.82],
  Taiwan: [120.96, 23.7],
  Thailand: [100.99, 15.87],
  Tunisia: [9.54, 33.89],
  Turkey: [35.24, 38.96],
  Ukraine: [31.17, 48.38],
  'United Arab Emirates': [54.0, 24.0],
  'United Kingdom': [-1.8, 53.0],
  'United States': [-98.5, 39.5],
  Uruguay: [-55.77, -32.52],
  Uzbekistan: [64.59, 41.38],
  Venezuela: [-66.59, 6.42],
  Vietnam: [108.28, 14.06],
};

/** Other spellings people use → the name above. */
const ALIASES: Record<string, string> = {
  usa: 'United States',
  us: 'United States',
  'united states of america': 'United States',
  america: 'United States',
  uk: 'United Kingdom',
  england: 'United Kingdom',
  scotland: 'United Kingdom',
  wales: 'United Kingdom',
  'great britain': 'United Kingdom',
  uae: 'United Arab Emirates',
  emirates: 'United Arab Emirates',
  dubai: 'United Arab Emirates',
  'czech republic': 'Czechia',
  korea: 'South Korea',
  holland: 'Netherlands',
  'the netherlands': 'Netherlands',
  türkiye: 'Turkey',
  turkiye: 'Turkey',
  ksa: 'Saudi Arabia',
};

export type Place = { name: string; lon: number; lat: number; home?: boolean };

/** Name → place. Unknown names are reported in the console and skipped. */
export function toPlaces(names: string[]): Place[] {
  const seen = new Set<string>();
  const out: Place[] = [];
  for (const raw of names) {
    const key = raw.trim();
    const name = COUNTRY_COORDS[key] ? key : ALIASES[key.toLowerCase()] ?? key;
    const c = COUNTRY_COORDS[name];
    if (!c) {
      if (typeof console !== 'undefined') console.warn(`[globe] No coordinates for "${raw}" — add it to lib/countries.ts`);
      continue;
    }
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({ name, lon: c[0], lat: c[1] });
  }
  return out;
}
