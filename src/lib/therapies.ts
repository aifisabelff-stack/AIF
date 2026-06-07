/** Catálogo visual de terapias (agrupa sesión + bono en la misma tarjeta) */
export type TherapyIconId =
  | "droplets"
  | "syringe"
  | "flask"
  | "zap"
  | "package"
  | "sparkles";

export type TherapyCatalogGroup = {
  key: string;
  title: string;
  subtitle?: string;
  /** Texto breve para la ficha pública en la landing */
  info?: string;
  icon: TherapyIconId;
  sortOrder: number;
  sessionPrice?: number;
  bonoPrice?: number;
  /** Texto bajo el bono, p. ej. «70 €/sesión» */
  bonoPerSessionNote?: string;
  packPrice?: number;
  valuationOnly?: boolean;
  /** Una sola fila en BD con el título (p. ej. Valoración) */
  singleOption?: boolean;
};

export type DefaultOfferedTherapy = {
  name: string;
  sortOrder: number;
  price: number | null;
  groupKey: string;
};

export const THERAPY_CATALOG: TherapyCatalogGroup[] = [
  {
    key: "valoracion",
    title: "Valoración",
    info: "Primera visita para conocer tu piel y recomendarte el tratamiento más adecuado.",
    icon: "sparkles",
    sortOrder: -1,
    singleOption: true,
  },
  {
    key: "higiene-facial",
    title: "Higiene Facial profunda",
    info: "Limpieza profunda, extracción de impurezas y renovación de la piel con acabado luminoso.",
    icon: "droplets",
    sortOrder: 0,
    sessionPrice: 75,
    bonoPrice: 210,
    bonoPerSessionNote: "70 €/sesión",
  },
  {
    key: "microneedling",
    title: "Microneedling + Exosomas (Mesoxome)",
    info: "Estimula la regeneración cutánea y potencia la penetración de exosomas para firmeza y calidad de piel.",
    icon: "syringe",
    sortOrder: 1,
    sessionPrice: 150,
    bonoPrice: 425,
  },
  {
    key: "peeling",
    title: "Peeling Facial",
    info: "Renovación superficial o media según necesidad: unifica el tono y mejora textura y luminosidad.",
    icon: "flask",
    sortOrder: 2,
    sessionPrice: 85,
    bonoPrice: 240,
  },
  {
    key: "plasma-pen",
    title: "Plasma Pen",
    subtitle: "Precio según zona y valoración previa",
    info: "Tratamiento de plasma fraccionado para arrugas, flacidez y marcas; requiere valoración personalizada.",
    icon: "zap",
    sortOrder: 3,
    valuationOnly: true,
  },
  {
    key: "pack-glow",
    title: "Pack Glow Facial",
    subtitle: "Higiene facial profunda + peeling facial",
    info: "Combinación de higiene profunda y peeling en una sola sesión para un efecto glow visible.",
    icon: "sparkles",
    sortOrder: 4,
    packPrice: 145,
  },
  {
    key: "pack-regeneracion",
    title: "Pack Regeneración premium",
    subtitle: "Higiene facial profunda + microneedling con exosomas",
    info: "Protocolo premium que une limpieza profunda y microneedling con exosomas para regenerar la piel.",
    icon: "package",
    sortOrder: 5,
    packPrice: 210,
  },
];

function sessionDbName(title: string) {
  return `${title} — Sesión`;
}

function bonoDbName(group: TherapyCatalogGroup) {
  if (!group.bonoPrice) return "";
  return group.bonoPerSessionNote
    ? `${group.title} — Bono 3 sesiones (${group.bonoPerSessionNote})`
    : `${group.title} — Bono 3 sesiones`;
}

function valuationDbName(title: string) {
  return `${title} (precio según zona y valoración previa)`;
}

export function catalogToDbEntries(group: TherapyCatalogGroup): DefaultOfferedTherapy[] {
  const out: DefaultOfferedTherapy[] = [];
  const base = group.sortOrder * 10;

  if (group.singleOption) {
    out.push({
      name: group.title,
      sortOrder: base,
      price: null,
      groupKey: group.key,
    });
    return out;
  }

  if (group.sessionPrice != null) {
    out.push({
      name: sessionDbName(group.title),
      sortOrder: base,
      price: group.sessionPrice,
      groupKey: group.key,
    });
  }
  if (group.bonoPrice != null) {
    out.push({
      name: bonoDbName(group),
      sortOrder: base + 1,
      price: group.bonoPrice,
      groupKey: group.key,
    });
  }
  if (group.packPrice != null) {
    out.push({
      name: group.title,
      sortOrder: base,
      price: group.packPrice,
      groupKey: group.key,
    });
  }
  if (group.valuationOnly) {
    out.push({
      name: valuationDbName(group.title),
      sortOrder: base,
      price: null,
      groupKey: group.key,
    });
  }
  return out;
}

export const DEFAULT_OFFERED_THERAPIES: DefaultOfferedTherapy[] =
  THERAPY_CATALOG.flatMap(catalogToDbEntries);

export function catalogDbNamesForGroup(group: TherapyCatalogGroup): string[] {
  return catalogToDbEntries(group).map((e) => e.name);
}

export function findCatalogGroupByDbName(name: string): TherapyCatalogGroup | undefined {
  for (const g of THERAPY_CATALOG) {
    if (catalogDbNamesForGroup(g).includes(name)) return g;
  }
  return undefined;
}

export function findCatalogGroupByKey(key: string): TherapyCatalogGroup | undefined {
  return THERAPY_CATALOG.find((g) => g.key === key);
}

export function getActiveCatalogGroups(
  offered: { name: string; price: number | null }[]
): TherapyCatalogGroup[] {
  const activeNames = new Set(offered.map((t) => t.name));
  return THERAPY_CATALOG.filter((g) =>
    catalogDbNamesForGroup(g).some((n) => activeNames.has(n))
  );
}
