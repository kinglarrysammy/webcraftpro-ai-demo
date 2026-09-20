/** Client-side lead qualification signal extraction (EN + FR + Moroccan variants). Demo only — not a production LLM. */

export type Field = "buyOrRent" | "propertyType" | "budget" | "location" | "timeline";

export interface Collected {
  buyOrRent?: string;
  propertyType?: string;
  budget?: string;
  location?: string;
  timeline?: string;
}

export const FIELD_ORDER: Field[] = ["buyOrRent", "propertyType", "budget", "location", "timeline"];

export const FIELD_LABELS: Record<Field, string> = {
  buyOrRent: "Buy or rent",
  propertyType: "Property type",
  budget: "Budget",
  location: "Preferred location",
  timeline: "Timeline",
};

export function parseAmount(numStr: string, scaleWord?: string): number | null {
  let raw = numStr.trim();
  if (!raw) return null;
  if (/^\d+,\d{1,2}$/.test(raw)) {
    raw = raw.replace(",", ".");
  } else {
    raw = raw.replace(/[\s,]/g, "");
  }
  if (!/^[\d.]+$/.test(raw)) return null;
  let n = parseFloat(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  const s = (scaleWord || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (s === "k" || s === "thousand" || s === "mille") n *= 1_000;
  else if (s === "m" || s === "mil" || s === "million" || s === "millions") n *= 1_000_000;
  else if (s === "b" || s === "billion" || s === "milliard" || s === "milliards") n *= 1_000_000_000;
  if (!Number.isFinite(n)) return null;
  return n;
}

export function detectCurrency(text: string): "MAD" | "USD" | "EUR" | null {
  if (/\b(mad|dirhams?|dh)\b/i.test(text)) return "MAD";
  if (/\b(eur|euros?|\u20ac)\b/i.test(text)) return "EUR";
  if (/\b(usd|dollars?|\$)\b/i.test(text)) return "USD";
  return null;
}

export function formatAmount(n: number, currency: "MAD" | "USD" | "EUR" | null): string {
  if (!Number.isFinite(n)) return "";
  const cur = currency || "USD";
  const symbol = cur === "MAD" ? "" : cur === "EUR" ? "\u20ac" : "$";
  const suffix = cur === "MAD" ? " MAD" : cur === "EUR" ? "" : "";
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    const body = m % 1 === 0 ? String(m) : m.toFixed(1).replace(/\.0$/, "");
    return `${symbol}${body}M${suffix}`.trim();
  }
  if (n >= 10_000) {
    const k = n / 1_000;
    const body = k % 1 === 0 ? String(Math.round(k)) : k.toFixed(1).replace(/\.0$/, "");
    return `${symbol}${body}k${suffix}`.trim();
  }
  return `${symbol}${Math.round(n).toLocaleString()}${suffix}`.trim();
}

export function isApprox(text: string): boolean {
  return /\b(around|about|roughly|environ|autour|pr[e\u00e8]s de|pres de|approx)\b/i.test(text);
}

export function parseBudget(text: string): string | null {
  const t = text;
  let currency = detectCurrency(t);
  const morocco =
    /\b(casablanca|casa|rabat|marrakech|marrakesh|agadir|tanger|tangier|fes|fez|mekn[e\u00e8]s|oujda|t[e\u00e9]touan)\b/i.test(
      t
    );
  if (!currency && morocco) currency = "MAD";

  const monthly = /\b(per\s+month|\/\s*mo|a\s+month|monthly|\/month|par\s+mois|\/\s*mois)\b/i.test(t);

  const rangeWord = t.match(
    /(?:between|from|around|entre|de)?\s*([\d\s.,]+)\s*(k|m|b|thousand|million|millions|milliard|milliards|mil|mille)?\s*(?:[-\u2013\u2014]|to|and|et)\s*([\d\s.,]+)\s*(k|m|b|thousand|million|millions|milliard|milliards|mil|mille)?(?:\s*(?:de\s+)?(?:mad|dirhams?|dh|usd|dollars?|eur|euros?))?/i
  );
  if (rangeWord) {
    const scale2 = rangeWord[4] || rangeWord[2];
    const scale1 = rangeWord[2] || rangeWord[4];
    const a = parseAmount(rangeWord[1], scale1);
    const b = parseAmount(rangeWord[3], scale2);
    if (a != null && b != null) {
      return `${formatAmount(a, currency)}\u2013${formatAmount(b, currency)}`;
    }
  }

  const singleWord = t.match(
    /(?:budget|price|prix|autour\s+de|pr[e\u00e8]s\s+de|pres\s+de|around|about|roughly|environ|up to|under|max(?:imum)?|jusqu['']?[\u00e0a])?\s*:?\s*(?:de\s+)?([\d\s.,]+)\s*(k|m|b|thousand|million|millions|milliard|milliards|mil|mille)\b(?:\s*(?:de\s+)?(?:mad|dirhams?|dh|usd|dollars?|eur|euros?))?/i
  );
  if (singleWord) {
    const n = parseAmount(singleWord[1], singleWord[2]);
    if (n != null) {
      if (!currency && n >= 100_000) currency = "MAD";
      const formatted = formatAmount(n, currency);
      if (formatted) {
        if (monthly) return `${formatted}/mo`;
        if (isApprox(t)) return `Around ${formatted}`;
        if (/\b(up to|under|max|jusqu)/i.test(t)) return `Up to ${formatted}`;
        return formatted;
      }
    }
  }

  const compact = t.match(
    /\$?\s*([\d.,]+)\s*([kKmMbB])\b(?:\s*(?:mad|dirhams?|dh|usd|dollars?|eur|euros?))?/
  );
  if (compact) {
    const idx = compact.index ?? 0;
    const after = t.slice(idx + compact[0].length, idx + compact[0].length + 16);
    const before = t.slice(Math.max(0, idx - 14), idx);
    const isTime =
      /^\s*(onths?|inutes?|iles?)\b/i.test(after) ||
      /\b(within|dans|d['']ici|sous)\s+$/i.test(before);
    if (!isTime) {
      const n = parseAmount(compact[1], compact[2]);
      if (n != null) {
        if (!currency && n >= 100_000) currency = "MAD";
        const formatted = formatAmount(n, currency);
        if (formatted) {
          if (monthly) return `${formatted}/mo`;
          if (isApprox(t)) return `Around ${formatted}`;
          return formatted;
        }
      }
    }
  }

  const plainCur = t.match(
    /([\d]{1,3}(?:[\s,]\d{3})+|\d{4,})(?:[.,]\d+)?\s*(mad|dirhams?|dh|usd|dollars?|eur|euros?|\$)?/i
  );
  if (plainCur) {
    const n = parseAmount(plainCur[1].replace(/\s/g, ""), undefined);
    if (n != null && n >= 100) {
      let cur = currency;
      if (plainCur[2] && /mad|dirham|dh/i.test(plainCur[2])) cur = "MAD";
      else if (plainCur[2] && /eur/i.test(plainCur[2])) cur = "EUR";
      else if (plainCur[2]) cur = "USD";
      else if (!cur && morocco) cur = "MAD";
      const formatted = formatAmount(n, cur);
      if (formatted) {
        if (monthly) return `${formatted}/mo`;
        if (isApprox(t)) return `Around ${formatted}`;
        return formatted;
      }
    }
  }

  return null;
}

export function isValidValue(v: unknown): v is string {
  if (v == null) return false;
  if (typeof v !== "string") return false;
  const s = v.trim();
  if (!s) return false;
  if (/nan/i.test(s)) return false;
  if (/undefined/i.test(s)) return false;
  if (/null/i.test(s)) return false;
  return true;
}

export const CITY_ALIASES: Record<string, string> = {
  casa: "Casablanca",
  casablanca: "Casablanca",
  rabat: "Rabat",
  marrakech: "Marrakech",
  marrakesh: "Marrakech",
  agadir: "Agadir",
  tanger: "Tangier",
  tangier: "Tangier",
  fes: "Fes",
  fez: "Fes",
  meknes: "Meknes",
  oujda: "Oujda",
  tetouan: "Tetouan",
  austin: "Austin",
  denver: "Denver",
  seattle: "Seattle",
  chicago: "Chicago",
  miami: "Miami",
  boston: "Boston",
  dubai: "Dubai",
  paris: "Paris",
  lyon: "Lyon",
};

export function normalizeLocation(raw: string): string | null {
  const key = raw.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (CITY_ALIASES[key]) return CITY_ALIASES[key];
  const cleaned = raw.trim();
  if (cleaned.length < 2) return null;
  if (/^(budget|around|about|within|environ|dans|pour|avec|villa|studio)$/i.test(cleaned)) return null;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function extractSignals(text: string): Partial<Collected> {
  const t = text.toLowerCase().trim();
  const out: Partial<Collected> = {};

  const buyRe =
    /\b(buy|buying|purchase|purchasing|own|invest|acheter|achat|acqu[e\u00e9]rir|acquisition)\b/i;
  const rentRe =
    /\b(rent|renting|rental|lease|leasing|louer|location|locatif|locative)\b/i;
  const unsureBuyRent =
    /\b(je ne sais pas|pas encore|ne sais pas encore|don'?t know|not sure).{0,40}\b(acheter|louer|buy|rent|achat|location)\b/i.test(
      text
    ) ||
    /\b(si je vais|whether (to|i)|acheter ou louer|buy or rent)\b/i.test(t);

  if (unsureBuyRent) {
    // leave empty
  } else if (buyRe.test(t) && !rentRe.test(t)) {
    out.buyOrRent = "Buy";
  } else if (rentRe.test(t) && !buyRe.test(t)) {
    out.buyOrRent = "Rent";
  } else if (/\b(either|both|open to (both|either)|les deux|indiff[e\u00e9]rent)\b/i.test(t)) {
    out.buyOrRent = "Open to either";
  } else if (/^(buy|buying|acheter|achat)$/i.test(text.trim())) {
    out.buyOrRent = "Buy";
  } else if (/^(rent|renting|lease|louer|location)$/i.test(text.trim())) {
    out.buyOrRent = "Rent";
  }

  const propRules: [RegExp, string][] = [
    [/\b(single[-\s]?family|detached)\b/, "Single-family home"],
    [/\b(town\s?house|townhome)\b/, "Townhouse"],
    [/\b(condo|condominium)\b/, "Condo"],
    [/\b(appart(?:ement)?['']?|apartment|apt|flat)\b/, "Apartment"],
    [/\b(studio)\b/, "Studio"],
    [/\b(loft)\b/, "Loft"],
    [/\b(duplex)\b/, "Duplex"],
    [/\b(villa)\b/, "Villa"],
    [/\b(terrain|land|plot)\b/, "Land / plot"],
    [/\b(bureau|office)\b/, "Office"],
    [/\b(local commercial|commercial (space|unit|property))\b/, "Commercial space"],
    [/\b(maison|house|home)\b/, "House"],
  ];
  for (const [re, label] of propRules) {
    if (re.test(t)) {
      out.propertyType = label;
      break;
    }
  }
  const bed = t.match(/\b(\d)\s*[-\s]?bed(room)?s?\b/);
  if (bed) {
    out.propertyType = out.propertyType
      ? `${bed[1]}-bed ${out.propertyType.toLowerCase()}`
      : `${bed[1]}-bedroom`;
  }

  const budgetParsed = parseBudget(text);
  if (budgetParsed) {
    out.budget = budgetParsed;
  } else if (/\bflexible\b|\bno (strict )?budget\b|\bopen on price\b/i.test(t)) {
    out.budget = "Flexible";
  }

  const locPrep =
    text.match(
      /\b(?:in|near|around|looking in|prefer|area of|au|aux|en)\s+([A-Za-z\u00c0-\u00ff][A-Za-z\u00c0-\u00ff\-']+)/i
    ) ||
    text.match(/\b\u00e0\s+([A-Za-z\u00c0-\u00ff][A-Za-z\u00c0-\u00ff\-']+)/i);
  if (locPrep) {
    const norm = normalizeLocation(locPrep[1]);
    if (norm) out.location = norm;
  }
  if (!out.location) {
    const cities =
      /\b(casablanca|casa|rabat|marrakech|marrakesh|agadir|tanger|tangier|fes|fez|mekn[e\u00e8]s|oujda|t[e\u00e9]touan|austin|denver|seattle|chicago|miami|boston|dubai|paris|lyon)\b/i;
    const m = text.match(cities);
    if (m) {
      const norm = normalizeLocation(m[1] || m[0]);
      if (norm) out.location = norm;
    }
  }

  const tNorm = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const notUrgent =
    /\b(pas urgent|sans urgence|pas presse|je ne suis pas presse|ne suis pas presse|pas de delai|pas de delai precis|quand j['']aurai trouve|no rush|not urgent|not in a hurry|whenever|flexible on timing)\b/i.test(
      tNorm
    );
  const nextYear = /\b(next year|l['']ann[e\u00e9]e prochaine|an prochain)\b/i.test(t);
  const asap =
    !notUrgent &&
    /\b(asap|immediately|right away|urgent|imm[e\u00e9]diatement|d[e\u00e8]s que possible|au plus vite|rapidement)\b/i.test(
      t
    );

  if (notUrgent) {
    out.timeline = "Flexible / Not urgent";
  } else if (asap) {
    out.timeline = "Immediate / ASAP";
  } else if (nextYear) {
    out.timeline = "Flexible / Around next year";
  } else if (/\b(this month|within (a |1 |one )?month|30 days|ce mois)\b/i.test(t)) {
    out.timeline = "Within 30 days";
  } else if (/\b(dans quelques mois|prochainement|next (few|couple of) months|1[-\u2013\u2014]3 months)\b/i.test(t)) {
    out.timeline = "1\u20133 months";
  } else if (/\b(3[-\u2013\u2014]6 months|cette ann[e\u00e9]e|this (year|summer|fall))\b/i.test(t)) {
    out.timeline = "3\u20136 months";
  } else if (/\b(6\+?\s*months|no rush)\b/i.test(t)) {
    out.timeline = "6+ months / flexible";
  } else {
    const tm =
      t.match(
        /\b(?:within|in|about|around|d['']ici|dans|sous)\s+(\d+)\s*(days?|weeks?|months?|jours?|semaines?|mois)\b/i
      ) || t.match(/\b(\d+)\s*(days?|weeks?|months?|jours?|semaines?|mois)\b/i);
    if (tm) {
      const n = tm[1];
      const unitRaw = tm[2].toLowerCase();
      let unit = unitRaw;
      if (/^jours?$/.test(unitRaw)) unit = n === "1" ? "day" : "days";
      else if (/^semaines?$/.test(unitRaw)) unit = n === "1" ? "week" : "weeks";
      else if (/^mois$/.test(unitRaw)) unit = n === "1" ? "month" : "months";
      out.timeline = `Within about ${n} ${unit}`;
    }
  }

  return out;
}
