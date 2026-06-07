import { z } from "zod";

export const patientSchema = z.object({
  firstName: z.string().min(1, "El nombre es obligatorio"),
  lastName: z.string().min(1, "Los apellidos son obligatorios"),
  dni: z.string().optional(),
  birthDate: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email no válido").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  referredBy: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
  notes: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  medicalConditions: z.string().optional(),
  skinType: z.string().optional(),
  contraindications: z.string().optional(),
  previousTreatments: z.string().optional(),
  consentSigned: z.coerce.boolean().optional(),
  consentDate: z.string().optional(),
});

export const treatmentSchema = z.object({
  patientId: z.string().min(1),
  name: z.string().min(1, "Indique el tratamiento"),
  date: z.string().optional(),
  area: z.string().optional(),
  product: z.string().optional(),
  dosage: z.string().optional(),
  notes: z.string().optional(),
  nextSession: z.string().optional(),
  price: z.coerce.number().optional(),
});

export const appointmentSchema = z.object({
  patientId: z.string().min(1),
  treatmentId: z.string().optional(),
  therapyId: z.string().min(1, "Seleccione una terapia"),
  date: z.string().min(1),
  startTime: z.string().min(1),
  durationMinutes: z.enum(["15", "30", "45", "60"], {
    errorMap: () => ({ message: "Seleccione la duración" }),
  }),
  notes: z.string().optional(),
  status: z
    .enum(["PENDING_CONFIRMATION", "SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"])
    .default("SCHEDULED"),
});

export const appointmentUpdateSchema = appointmentSchema.extend({
  appointmentId: z.string().min(1),
});

export const publicBookingSchema = z
  .object({
    clientType: z.enum(["new", "existing"]),
    patientId: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    secondLastName: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    therapyId: z.string().min(1, "Seleccione una terapia"),
    date: z.string().min(1, "Seleccione una fecha"),
    time: z.string().min(1, "Seleccione una hora"),
    durationMinutes: z.enum(["15", "30", "45", "60"], {
      errorMap: () => ({ message: "Seleccione la duración" }),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.clientType === "new") {
      if (!data.firstName || data.firstName.trim().length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indique su nombre",
          path: ["firstName"],
        });
      }
      if (!data.lastName || data.lastName.trim().length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indique su primer apellido",
          path: ["lastName"],
        });
      }
      const phone = data.phone?.trim() ?? "";
      const email = data.email?.trim() ?? "";

      if (!phone && !email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indique un teléfono o un email de contacto",
          path: ["phone"],
        });
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Indique un teléfono o un email de contacto",
          path: ["email"],
        });
      } else {
        if (phone && phone.length < 9) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Teléfono no válido (mínimo 9 dígitos)",
            path: ["phone"],
          });
        }
        if (email && !z.string().email().safeParse(email).success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Email no válido",
            path: ["email"],
          });
        }
      }
    } else if (!data.patientId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Seleccione su ficha de cliente",
        path: ["patientId"],
      });
    }
  });

export const invoiceSchema = z.object({
  patientId: z.string().min(1),
  date: z.string().optional(),
  dueDate: z.string().optional(),
  status: z
    .enum(["DRAFT", "ISSUED", "PENDING_PAYMENT", "PAID", "CANCELLED"])
    .default("ISSUED"),
  taxRate: z.coerce.number().min(0).max(100).default(21),
  notes: z.string().optional(),
  lines: z.array(
    z.object({
      description: z.string().min(1),
      quantity: z.coerce.number().min(0.01),
      unitPrice: z.coerce.number().min(0),
    })
  ).min(1, "Añada al menos una línea"),
});

export const expenseSchema = z.object({
  date: z.string().min(1),
  category: z.enum(["SUMINISTROS", "ALQUILER", "MARKETING", "EQUIPAMIENTO", "PERSONAL", "OTROS"]),
  description: z.string().min(1, "Descripción obligatoria"),
  amount: z.coerce.number().positive("El importe debe ser positivo"),
  notes: z.string().optional(),
});

export type PatientFormData = z.infer<typeof patientSchema>;
export type TreatmentFormData = z.infer<typeof treatmentSchema>;
