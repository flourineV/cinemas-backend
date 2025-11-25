// src/utils/age-rating-normalizer.js

// Nhận diện các giá trị "không xếp hạng"
const NR_SET = new Set(["NR", "UNRATED", "NOT RATED", "N/A", "NA", "NONE", ""]);

// Helper: chuẩn hoá string giống norm() trong Java
function norm(str) {
  if (str == null) return null;
  return str.trim().toUpperCase().replace(/\s+/g, " ");
}

function mapOf(...kv) {
  const m = new Map();
  for (let i = 0; i + 1 < kv.length; i += 2) {
    const k = norm(kv[i]);
    const v = kv[i + 1];
    m.set(k, v);
  }
  return m;
}

// US (MPA)
const US = mapOf(
  "G",
  "0+",
  "PG",
  "10+",
  "PG-13",
  "13+",
  "R",
  "17+",
  "NC-17",
  "18+"
);

// JP (Eirin)
const JP = mapOf(
  "G",
  "0+",
  "PG12",
  "12+",
  "R15+",
  "15+",
  "R15",
  "15+",
  "R18+",
  "18+",
  "R18",
  "18+"
);

// DE (FSK)
const DE = mapOf(
  "FSK 0",
  "0+",
  "0",
  "0+",
  "FSK 6",
  "6+",
  "6",
  "6+",
  "FSK 12",
  "12+",
  "12",
  "12+",
  "FSK 16",
  "16+",
  "16",
  "16+",
  "FSK 18",
  "18+",
  "18",
  "18+"
);

// FR
const FR = mapOf(
  "U",
  "0+",
  "TOUS PUBLICS",
  "0+",
  "10",
  "10+",
  "12",
  "12+",
  "16",
  "16+",
  "18",
  "18+"
);

// AU
const AU = mapOf(
  "G",
  "0+",
  "PG",
  "10+",
  "M",
  "15+",
  "MA15+",
  "15+",
  "R18+",
  "18+",
  "X18+",
  "18+"
);

// CA
const CA = mapOf(
  "G",
  "0+",
  "PG",
  "10+",
  "14A",
  "14+",
  "18A",
  "18+",
  "R",
  "18+",
  "A",
  "18+"
);

// BR
const BR = mapOf(
  "L",
  "0+",
  "10",
  "10+",
  "12",
  "12+",
  "14",
  "14+",
  "16",
  "16+",
  "18",
  "18+"
);

// KR
const KR = mapOf(
  "ALL",
  "0+",
  "12",
  "12+",
  "15",
  "15+",
  "18",
  "18+",
  "19",
  "18+" // 19 gộp 18+
);

// ES
const ES = mapOf(
  "APTA",
  "0+",
  "7",
  "7+",
  "12",
  "12+",
  "16",
  "16+",
  "18",
  "18+"
);

// IT
const IT = mapOf("T", "0+", "6", "6+", "12", "12+", "14", "14+", "18", "18+");

// IN (CBFC)
const IN = mapOf("U", "0+", "UA", "13+", "A", "18+", "S", "18+");

// TV Ratings
const TV = mapOf(
  "TV-Y",
  "0+",
  "TV-Y7",
  "7+",
  "TV-G",
  "0+",
  "TV-PG",
  "10+",
  "TV-14",
  "14+",
  "TV-MA",
  "17+"
);

// Gom lại cho fallback
const ALL_MAPS = [US, JP, DE, FR, AU, CA, BR, KR, ES, IT, IN, TV];

// Regex bắt số bất kỳ trong chuỗi
const ANY_DIGIT = /.*?(\d{1,2}).*/;

/**
 * Chuẩn hoá rating TMDb về dạng "X+" hoặc "NR".
 * raw: ví dụ "PG-13", "R", "PG12", "FSK 16", "14A", "NR", ...
 */
function normalize(raw) {
  const c = norm(raw);
  if (c == null || NR_SET.has(c)) return "NR";

  // 1) Ưu tiên US trước
  let hit = US.get(c);
  if (hit) return hit;

  // 2) Fallback các map khác
  for (const m of ALL_MAPS) {
    hit = m.get(c);
    if (hit) return hit;
  }

  // 3) Nếu có số trong chuỗi -> dùng số
  const m = c.match(ANY_DIGIT);
  if (m) {
    const age = parseInt(m[1], 10);
    if (!Number.isNaN(age)) {
      if (age >= 18) return "18+";
      if (age <= 0) return "0+";
      return `${age}+`;
    }
  }

  // 4) Không nhận diện được -> NR
  return "NR";
}

/**
 * Lấy min-age từ "X+" (vd: "13+" -> 13). "NR" -> null.
 */
function extractMinAge(normalized) {
  const n = norm(normalized);
  if (n == null || n === "NR") return null;

  const m = n.match(ANY_DIGIT);
  if (!m) return null;

  const age = parseInt(m[1], 10);
  if (Number.isNaN(age) || age < 0) return null;

  return Math.min(age, 18);
}

module.exports = { normalize, extractMinAge };
