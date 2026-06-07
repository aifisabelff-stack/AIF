export const BRAND = {
  name: "IAF",
  aesthetic: "A E S T H E T I C",
  subtitle: "Enfermería Dermoestética",
  owner: "Isabel Arriaga",
  tagline: "Ciencia • Piel • Confianza",
  slogan: "Tu piel, mi compromiso.",
  phone: "663 704 720",
  phoneHref: "tel:+34663704720",
  address: "Av. de José Hierro, 92, Local 22",
  city: "28521 Rivas-Vaciamadrid, Madrid",
  instagram: "@iaf_aesthetic",
  instagramUrl: "https://instagram.com/iaf_aesthetic",
} as const;

export type FlagshipStepIconId =
  | "droplets"
  | "waves"
  | "zap"
  | "wind"
  | "thermometer"
  | "spray";

export type TreatmentStep = {
  id: number;
  title: string;
  description: string;
  icon: FlagshipStepIconId;
};

export const FLAGSHIP_TREATMENT = {
  name: "Ice Glow Facial",
  badge: "Tratamiento facial 6 en 1",
  intro:
    "Tecnología avanzada para una piel más sana, luminosa y joven. Un protocolo integral que combina seis fases en una misma sesión.",
  steps: [
    {
      id: 1,
      title: "Hidrodermoabrasión",
      description: "Limpieza profunda y renovación",
      icon: "droplets",
    },
    {
      id: 2,
      title: "Ultrasonidos",
      description: "Exfoliación suave y efectiva",
      icon: "waves",
    },
    {
      id: 3,
      title: "Electroporación",
      description: "Penetración de activos",
      icon: "zap",
    },
    {
      id: 4,
      title: "Oxigenación",
      description: "Piel más luminosa e hidratada",
      icon: "wind",
    },
    {
      id: 5,
      title: "Martillo frío / calor",
      description: "Calma, descongestiona y reafirma",
      icon: "thermometer",
    },
    {
      id: 6,
      title: "Spray",
      description: "Hidratación y frescura inmediata",
      icon: "spray",
    },
  ] satisfies TreatmentStep[],
  results: [
    "Piel más luminosa y uniforme",
    "Poros limpios y reducidos",
    "Hidratación profunda",
    "Mejora de textura y elasticidad",
    "Efecto glow inmediato",
  ],
} as const;
