// Índice central de servicios Firestore

export * from "./firestore-types";
export * as firestoreClients from "./firestore-clients";
export * as firestoreAppointments from "./firestore-appointments";
export * as firestoreTreatments from "./firestore-treatments";
export * as firestoreInvoices from "./firestore-invoices";
export * as firestoreTherapies from "./firestore-therapies";
export * as firestoreStats from "./firestore-stats";
export * as firestoreBlockedSlots from "./firestore-blocked-slots";
export * as firestoreExpenses from "./firestore-expenses";
export * as firestorePanelAccess from "./firestore-panel-access";

export { auth, db, storage, messaging } from "./firebase-client";
