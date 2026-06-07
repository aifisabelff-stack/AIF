// Tipos compartidos para Firestore
export type ClientStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type PatientStatus = ClientStatus;
export type Patient = Client;

export type AppointmentStatus =
  | "PENDING_CONFIRMATION"
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PENDING_PAYMENT"
  | "PAID"
  | "CANCELLED";

export type ExpenseCategory =
  | "SUMINISTROS"
  | "ALQUILER"
  | "MARKETING"
  | "EQUIPAMIENTO"
  | "PERSONAL"
  | "OTROS";

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dni?: string;
  birthDate?: Date;
  address?: string;
  city?: string;
  postalCode?: string;
  referredBy?: string;
  status: ClientStatus;
  notes?: string;

  allergies?: string;
  medications?: string;
  medicalConditions?: string;
  skinType?: string;
  contraindications?: string;
  previousTreatments?: string;
  consentSigned?: boolean;
  consentDate?: Date;

  createdAt: Date;
  updatedAt: Date;

  totalVisits?: number;
  lastVisit?: Date;
  totalSpent?: number;
}

export interface Appointment {
  id: string;
  clientId: string;
  therapyId?: string;
  offeredTherapyId?: string | null;
  therapyName?: string | null;
  title: string;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
  notes?: string;
  confirmedAt?: Date;
  performedAt?: Date;
  price?: number;
  treatmentId?: string | null;
  invoiceId?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface Treatment {
  id: string;
  clientId: string;
  name: string;
  area?: string;
  product?: string;
  dosage?: string;
  date: Date;
  notes?: string;
  nextSession?: Date;
  price?: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface Therapy {
  id: string;
  name: string;
  active: boolean;
  price: number | null;
  duration?: number;
  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  clientId: string;
  appointmentId?: string;
  number: string;
  date: Date;
  dueDate?: Date;
  status: InvoiceStatus;
  notes?: string;

  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;

  items: InvoiceItem[];

  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Expense {
  id: string;
  date: Date;
  category: ExpenseCategory;
  description: string;
  amount: number;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface PanelAccessConfig {
  id: string;
  enabled: boolean;
  passwordHash?: string | null;
  updatedAt: Date;
}

export interface MonthlyStats {
  month: string;
  totalRevenue: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  newClients: number;
  byTherapy: Record<string, { revenue: number; count: number }>;
}

/** Cita enriquecida para la agenda (compatibilidad con UI existente). */
export type AgendaAppointment = Appointment & {
  patientId: string;
  patient: Pick<Client, "id" | "firstName" | "lastName" | "phone">;
  treatment: { name: string } | null;
  offeredTherapy: { price: number | null; name?: string } | null;
  invoice: { id: string } | null;
};
